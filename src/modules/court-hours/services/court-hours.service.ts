import {
  CourtNotFoundError,
  CourtOrganizationMismatchError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { CourtHoursWindowRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { SetCourtHoursDTO } from "../dtos";
import { CourtHoursOverlapError } from "../errors/court-hours.errors";
import type { ICourtHoursRepository } from "../repositories/court-hours.repository";

export interface ICourtHoursService {
  getHours(courtId: string): Promise<CourtHoursWindowRecord[]>;
  setHours(
    userId: string,
    data: SetCourtHoursDTO,
  ): Promise<CourtHoursWindowRecord[]>;
  copyFromCourt(
    userId: string,
    sourceCourtId: string,
    targetCourtId: string,
  ): Promise<CourtHoursWindowRecord[]>;
}

export class CourtHoursService implements ICourtHoursService {
  constructor(
    private courtHoursRepository: ICourtHoursRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  async getHours(courtId: string): Promise<CourtHoursWindowRecord[]> {
    return this.courtHoursRepository.findByCourtId(courtId);
  }

  async setHours(
    userId: string,
    data: SetCourtHoursDTO,
  ): Promise<CourtHoursWindowRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);
      this.assertNoOverlaps(data.courtId, data.windows);

      await this.courtHoursRepository.deleteByCourtId(data.courtId, ctx);

      const created = await this.courtHoursRepository.createMany(
        data.windows.map((window) => ({
          courtId: data.courtId,
          dayOfWeek: window.dayOfWeek,
          startMinute: window.startMinute,
          endMinute: window.endMinute,
        })),
        ctx,
      );

      logger.info(
        {
          event: "court_hours.updated",
          courtId: data.courtId,
          userId,
          windowCount: created.length,
        },
        "Court hours updated",
      );

      return created;
    });
  }

  async copyFromCourt(
    userId: string,
    sourceCourtId: string,
    targetCourtId: string,
  ): Promise<CourtHoursWindowRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const sourceCourt = await this.courtRepository.findById(
        sourceCourtId,
        ctx,
      );
      if (!sourceCourt) {
        throw new CourtNotFoundError(sourceCourtId);
      }

      const targetCourt = await this.courtRepository.findById(
        targetCourtId,
        ctx,
      );
      if (!targetCourt) {
        throw new CourtNotFoundError(targetCourtId);
      }

      await this.verifyCourtOwnership(userId, sourceCourtId, ctx);
      await this.verifyCourtOwnership(userId, targetCourtId, ctx);

      const sourcePlace = await this.placeRepository.findById(
        sourceCourt.placeId,
        ctx,
      );
      const targetPlace = await this.placeRepository.findById(
        targetCourt.placeId,
        ctx,
      );

      if (
        !sourcePlace?.organizationId ||
        !targetPlace?.organizationId ||
        sourcePlace.organizationId !== targetPlace.organizationId
      ) {
        throw new CourtOrganizationMismatchError();
      }

      const sourceHours = await this.courtHoursRepository.findByCourtId(
        sourceCourtId,
        ctx,
      );

      await this.courtHoursRepository.deleteByCourtId(targetCourtId, ctx);

      const created = await this.courtHoursRepository.createMany(
        sourceHours.map((window) => ({
          courtId: targetCourtId,
          dayOfWeek: window.dayOfWeek,
          startMinute: window.startMinute,
          endMinute: window.endMinute,
        })),
        ctx,
      );

      logger.info(
        {
          event: "court_hours.copied",
          userId,
          sourceCourtId,
          targetCourtId,
          windowCount: created.length,
        },
        "Court hours copied",
      );

      return created;
    });
  }

  private async verifyCourtOwnership(
    userId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    const place = await this.placeRepository.findById(court.placeId, ctx);
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

  private assertNoOverlaps(
    courtId: string,
    windows: { dayOfWeek: number; startMinute: number; endMinute: number }[],
  ): void {
    const byDay = new Map<
      number,
      { startMinute: number; endMinute: number }[]
    >();
    for (const window of windows) {
      const list = byDay.get(window.dayOfWeek) ?? [];
      list.push({
        startMinute: window.startMinute,
        endMinute: window.endMinute,
      });
      byDay.set(window.dayOfWeek, list);
    }

    for (const [dayOfWeek, dayWindows] of byDay.entries()) {
      const sorted = dayWindows.sort((a, b) => a.startMinute - b.startMinute);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startMinute < sorted[i - 1].endMinute) {
          throw new CourtHoursOverlapError(courtId, dayOfWeek);
        }
      }
    }
  }
}
