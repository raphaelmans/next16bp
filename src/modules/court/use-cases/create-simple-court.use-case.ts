import type { TransactionManager } from "@/shared/kernel/transaction";
import type { RequestContext } from "@/shared/kernel/context";
import type { ICourtRepository } from "../repositories/court.repository";
import type { IReservableCourtDetailRepository } from "../repositories/reservable-court-detail.repository";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { CreateSimpleCourtDTO } from "../dtos";
import type { CourtRecord } from "@/shared/infra/db/schema";
import { NotOrganizationOwnerError } from "@/modules/organization/errors/organization.errors";
import { OrganizationNotFoundError } from "@/modules/organization/errors/organization.errors";
import { logger } from "@/shared/infra/logger";

export interface ICreateSimpleCourtUseCase {
  execute(userId: string, data: CreateSimpleCourtDTO): Promise<CourtRecord>;
}

export class CreateSimpleCourtUseCase implements ICreateSimpleCourtUseCase {
  constructor(
    private courtRepository: ICourtRepository,
    private reservableCourtDetailRepository: IReservableCourtDetailRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    userId: string,
    data: CreateSimpleCourtDTO,
  ): Promise<CourtRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // Verify user owns the organization
      const org = await this.organizationRepository.findById(
        data.organizationId,
        ctx,
      );
      if (!org) {
        throw new OrganizationNotFoundError(data.organizationId);
      }
      if (org.ownerUserId !== userId) {
        throw new NotOrganizationOwnerError();
      }

      // Create the court with default coordinates (can be updated later)
      const court = await this.courtRepository.create(
        {
          organizationId: data.organizationId,
          name: data.name,
          address: data.address,
          city: data.city,
          latitude: "0.0",
          longitude: "0.0",
          courtType: "RESERVABLE",
          claimStatus: "CLAIMED", // Organization-created courts are already claimed
        },
        ctx,
      );

      // Determine if court is free based on defaultPrice
      const isFree = data.defaultPrice === null || data.defaultPrice === 0;

      // Create reservable court detail
      await this.reservableCourtDetailRepository.create(
        {
          courtId: court.id,
          isFree,
          defaultCurrency: data.currency,
          // Payment details can be added later through updateDetail
        },
        ctx,
      );

      logger.info(
        {
          event: "court.created_simple",
          courtId: court.id,
          organizationId: data.organizationId,
          courtType: "RESERVABLE",
          userId,
        },
        "Simple court created",
      );

      return court;
    });
  }
}
