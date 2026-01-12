import {
  NotOrganizationOwnerError,
  OrganizationNotFoundError,
} from "@/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { CourtRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { CreateCourtDTO } from "../dtos";
import type { ICourtRepository } from "../repositories/court.repository";

export interface ICreateSimpleCourtUseCase {
  execute(userId: string, data: CreateCourtDTO): Promise<CourtRecord>;
}

export class CreateSimpleCourtUseCase implements ICreateSimpleCourtUseCase {
  constructor(
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(userId: string, data: CreateCourtDTO): Promise<CourtRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const place = await this.placeRepository.findById(data.placeId, ctx);
      if (!place || !place.organizationId) {
        throw new OrganizationNotFoundError(data.placeId);
      }

      const organization = await this.organizationRepository.findById(
        place.organizationId,
        ctx,
      );
      if (!organization || organization.ownerUserId !== userId) {
        throw new NotOrganizationOwnerError();
      }

      const court = await this.courtRepository.create(
        {
          placeId: data.placeId,
          sportId: data.sportId,
          label: data.label,
          tierLabel: data.tierLabel ?? null,
          isActive: true,
        },
        ctx,
      );

      logger.info(
        {
          event: "court.created_simple",
          courtId: court.id,
          placeId: data.placeId,
          userId,
        },
        "Simple court created",
      );

      return court;
    });
  }
}
