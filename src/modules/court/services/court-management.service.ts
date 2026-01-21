import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { CourtRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type {
  CreateCourtDTO,
  ListCourtsByPlaceDTO,
  UpdateCourtDTO,
} from "../dtos";
import {
  CourtNotFoundError,
  DuplicateCourtLabelError,
  NotCourtOwnerError,
} from "../errors/court.errors";
import type {
  CourtWithSport,
  ICourtRepository,
} from "../repositories/court.repository";

export interface ICourtManagementService {
  createCourt(userId: string, data: CreateCourtDTO): Promise<CourtRecord>;
  updateCourt(userId: string, data: UpdateCourtDTO): Promise<CourtRecord>;
  getCourtById(userId: string, courtId: string): Promise<CourtWithSport>;
  listCourtsByPlace(
    userId: string,
    data: ListCourtsByPlaceDTO,
  ): Promise<CourtWithSport[]>;
}

export class CourtManagementService implements ICourtManagementService {
  constructor(
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  async createCourt(
    userId: string,
    data: CreateCourtDTO,
  ): Promise<CourtRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyPlaceOwnership(userId, data.placeId, ctx);
      await this.assertLabelUnique(data.placeId, data.label, undefined, ctx);

      const created = await this.courtRepository.create(
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
          event: "court.created",
          courtId: created.id,
          placeId: data.placeId,
          sportId: data.sportId,
          userId,
        },
        "Court created",
      );

      return created;
    });
  }

  async updateCourt(
    userId: string,
    data: UpdateCourtDTO,
  ): Promise<CourtRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const { court, placeId } = await this.verifyCourtOwnership(
        userId,
        data.courtId,
        ctx,
      );

      if (data.label) {
        await this.assertLabelUnique(placeId, data.label, court.id, ctx);
      }

      const { courtId, ...updateData } = data;
      const updated = await this.courtRepository.update(
        courtId,
        updateData,
        ctx,
      );

      logger.info(
        {
          event: "court.updated",
          courtId,
          userId,
          fields: Object.keys(updateData),
        },
        "Court updated",
      );

      return updated;
    });
  }

  async getCourtById(userId: string, courtId: string): Promise<CourtWithSport> {
    await this.verifyCourtOwnership(userId, courtId);
    const court = await this.courtRepository.findByIdWithSport(courtId);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }
    return court;
  }

  async listCourtsByPlace(
    userId: string,
    data: ListCourtsByPlaceDTO,
  ): Promise<CourtWithSport[]> {
    await this.verifyPlaceOwnership(userId, data.placeId);
    return this.courtRepository.findByPlaceWithSport(data.placeId);
  }

  private async verifyPlaceOwnership(
    userId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const place = await this.placeRepository.findById(placeId, ctx);
    if (!place || !place.organizationId) {
      throw new NotCourtOwnerError();
    }

    const organization = await this.organizationRepository.findById(
      place.organizationId,
      ctx,
    );
    if (!organization || organization.ownerUserId !== userId) {
      throw new NotCourtOwnerError();
    }
  }

  private async verifyCourtOwnership(
    userId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<{ court: CourtRecord; placeId: string }> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    if (!court.placeId) {
      throw new NotCourtOwnerError();
    }

    await this.verifyPlaceOwnership(userId, court.placeId, ctx);

    return { court, placeId: court.placeId };
  }

  private async assertLabelUnique(
    placeId: string,
    label: string,
    excludeCourtId?: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const courts = await this.courtRepository.findByPlaceId(placeId, ctx);
    const exists = courts.some(
      (court) =>
        court.label.toLowerCase() === label.toLowerCase() &&
        court.id !== excludeCourtId,
    );
    if (exists) {
      throw new DuplicateCourtLabelError(placeId, label);
    }
  }
}
