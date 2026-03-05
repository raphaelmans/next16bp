import { differenceInMinutes } from "date-fns";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/lib/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { ICourtHoursRepository } from "@/lib/modules/court-hours/repositories/court-hours.repository";
import type { ICourtPriceOverrideRepository } from "@/lib/modules/court-price-override/repositories/court-price-override.repository";
import type { ICourtRateRuleRepository } from "@/lib/modules/court-rate-rule/repositories/court-rate-rule.repository";
import type { IOrganizationMemberService } from "@/lib/modules/organization-member/services/organization-member.service";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { IReservationRepository } from "@/lib/modules/reservation/repositories/reservation.repository";
import type {
  CourtBlockRecord,
  CourtRecord,
  InsertCourtBlock,
  PlaceRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import { computeSchedulePrice } from "@/lib/shared/lib/schedule-availability";
import type {
  CancelCourtBlockDTO,
  CreateCourtBlockDTO,
  ListCourtBlocksDTO,
  UpdateCourtBlockRangeDTO,
} from "../dtos";
import {
  CourtBlockDurationInvalidError,
  CourtBlockNotFoundError,
  CourtBlockOverlapError,
  CourtBlockOverlapsReservationError,
  CourtBlockPricingUnavailableError,
  CourtBlockTimeRangeInvalidError,
} from "../errors/court-block.errors";
import type { ICourtBlockRepository } from "../repositories/court-block.repository";

export interface ICourtBlockService {
  listForCourtRange(
    userId: string,
    data: ListCourtBlocksDTO,
  ): Promise<CourtBlockRecord[]>;
  createMaintenance(
    userId: string,
    data: CreateCourtBlockDTO,
  ): Promise<CourtBlockRecord>;
  createWalkIn(
    userId: string,
    data: CreateCourtBlockDTO,
  ): Promise<CourtBlockRecord>;
  updateRange(
    userId: string,
    data: UpdateCourtBlockRangeDTO,
  ): Promise<CourtBlockRecord>;
  cancelBlock(
    userId: string,
    data: CancelCourtBlockDTO,
  ): Promise<CourtBlockRecord>;
}

export class CourtBlockService implements ICourtBlockService {
  constructor(
    private courtBlockRepository: ICourtBlockRepository,
    private reservationRepository: IReservationRepository,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private organizationMemberService: IOrganizationMemberService,
    private courtHoursRepository: ICourtHoursRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
    private courtPriceOverrideRepository: ICourtPriceOverrideRepository,
    private transactionManager: TransactionManager,
  ) {}

  async listForCourtRange(
    userId: string,
    data: ListCourtBlocksDTO,
  ): Promise<CourtBlockRecord[]> {
    const { startTime, endTime } = this.parseRange(
      data.startTime,
      data.endTime,
      { requireHourMultiple: false },
    );
    await this.verifyCourtOwnership(userId, data.courtId);
    return this.courtBlockRepository.findByCourtIdInRange(
      data.courtId,
      startTime,
      endTime,
    );
  }

  async createMaintenance(
    userId: string,
    data: CreateCourtBlockDTO,
  ): Promise<CourtBlockRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const { startTime, endTime } = this.parseRange(
        data.startTime,
        data.endTime,
      );
      const { court } = await this.verifyCourtOwnership(
        userId,
        data.courtId,
        ctx,
      );

      await this.assertNoOverlaps(court.id, startTime, endTime, ctx);

      const created = await this.courtBlockRepository.create(
        {
          courtId: court.id,
          startTime,
          endTime,
          reason: this.normalizeReason(data.reason),
          type: "MAINTENANCE",
          totalPriceCents: 0,
          currency: "PHP",
          isActive: true,
        },
        ctx,
      );

      logger.info(
        {
          event: "court_block.created",
          courtId: court.id,
          blockId: created.id,
          type: "MAINTENANCE",
          startTime: created.startTime.toISOString(),
          endTime: created.endTime.toISOString(),
        },
        "Court maintenance block created",
      );

      return created;
    });
  }

  async createWalkIn(
    userId: string,
    data: CreateCourtBlockDTO,
  ): Promise<CourtBlockRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const { startTime, endTime, durationMinutes } = this.parseRange(
        data.startTime,
        data.endTime,
      );
      const { court, place } = await this.verifyCourtOwnership(
        userId,
        data.courtId,
        ctx,
      );

      await this.assertNoOverlaps(court.id, startTime, endTime, ctx);

      const pricing = await this.computeWalkInPricing(
        court.id,
        startTime,
        durationMinutes,
        place.timeZone,
        ctx,
      );

      const created = await this.courtBlockRepository.create(
        {
          courtId: court.id,
          startTime,
          endTime,
          reason: this.normalizeReason(data.reason),
          type: "WALK_IN",
          totalPriceCents: pricing.totalPriceCents,
          currency: pricing.currency,
          isActive: true,
        },
        ctx,
      );

      logger.info(
        {
          event: "court_block.created",
          courtId: court.id,
          blockId: created.id,
          type: "WALK_IN",
          startTime: created.startTime.toISOString(),
          endTime: created.endTime.toISOString(),
          totalPriceCents: created.totalPriceCents,
          currency: created.currency,
        },
        "Court walk-in block created",
      );

      return created;
    });
  }

  async updateRange(
    userId: string,
    data: UpdateCourtBlockRangeDTO,
  ): Promise<CourtBlockRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const block = await this.courtBlockRepository.findById(data.blockId, ctx);
      if (!block || !block.isActive) {
        throw new CourtBlockNotFoundError(data.blockId);
      }

      const { startTime, endTime, durationMinutes } = this.parseRange(
        data.startTime,
        data.endTime,
      );

      const { court, place } = await this.verifyCourtOwnership(
        userId,
        block.courtId,
        ctx,
      );

      await this.assertNoOverlaps(court.id, startTime, endTime, ctx, {
        excludeBlockId: block.id,
      });

      const updatePayload: Partial<InsertCourtBlock> = {
        startTime,
        endTime,
      };

      if (block.type === "WALK_IN") {
        const pricing = await this.computeWalkInPricing(
          court.id,
          startTime,
          durationMinutes,
          place.timeZone,
          ctx,
        );
        updatePayload.totalPriceCents = pricing.totalPriceCents;
        updatePayload.currency = pricing.currency;
      }

      const updated = await this.courtBlockRepository.update(
        block.id,
        updatePayload,
        ctx,
      );

      logger.info(
        {
          event: "court_block.rescheduled",
          courtId: court.id,
          blockId: updated.id,
          type: updated.type,
          startTime: updated.startTime.toISOString(),
          endTime: updated.endTime.toISOString(),
        },
        "Court block rescheduled",
      );

      return updated;
    });
  }

  async cancelBlock(
    userId: string,
    data: CancelCourtBlockDTO,
  ): Promise<CourtBlockRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const block = await this.courtBlockRepository.findById(data.blockId, ctx);
      if (!block) {
        throw new CourtBlockNotFoundError(data.blockId);
      }

      await this.verifyCourtOwnership(userId, block.courtId, ctx);

      if (!block.isActive) {
        return block;
      }

      const updated = await this.courtBlockRepository.update(
        block.id,
        { isActive: false, cancelledAt: new Date() },
        ctx,
      );

      logger.info(
        {
          event: "court_block.cancelled",
          courtId: block.courtId,
          blockId: block.id,
          type: block.type,
        },
        "Court block cancelled",
      );

      return updated;
    });
  }

  private normalizeReason(reason?: string): string | null {
    if (!reason) return null;
    const trimmed = reason.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseRange(
    startTime: string,
    endTime: string,
    options?: { requireHourMultiple?: boolean },
  ): {
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
  } {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new CourtBlockTimeRangeInvalidError({ startTime, endTime });
    }

    if (end <= start) {
      throw new CourtBlockTimeRangeInvalidError({ startTime, endTime });
    }

    const durationMinutes = differenceInMinutes(end, start);
    if (durationMinutes <= 0) {
      throw new CourtBlockTimeRangeInvalidError({ startTime, endTime });
    }

    if ((options?.requireHourMultiple ?? true) && durationMinutes % 60 !== 0) {
      throw new CourtBlockDurationInvalidError({ durationMinutes });
    }

    return { startTime: start, endTime: end, durationMinutes };
  }

  private async verifyCourtOwnership(
    userId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<{ court: CourtRecord; place: PlaceRecord }> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    if (!court.placeId) {
      throw new NotCourtOwnerError();
    }

    const place = await this.placeRepository.findById(court.placeId, ctx);
    if (!place) {
      throw new PlaceNotFoundError(court.placeId);
    }

    if (!place.organizationId) {
      throw new NotCourtOwnerError();
    }

    await this.organizationMemberService.assertOrganizationPermission(
      userId,
      place.organizationId,
      "place.manage",
      ctx,
    );

    return { court, place };
  }

  private async assertNoOverlaps(
    courtId: string,
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
    options?: { excludeBlockId?: string },
  ): Promise<void> {
    const [blocks, reservations] = await Promise.all([
      this.courtBlockRepository.findOverlappingByCourtIds(
        [courtId],
        startTime,
        endTime,
        undefined,
        ctx,
      ),
      this.reservationRepository.findOverlappingActiveByCourtIds(
        [courtId],
        startTime,
        endTime,
        ctx,
      ),
    ]);

    const filteredBlocks = options?.excludeBlockId
      ? blocks.filter((block) => block.id !== options.excludeBlockId)
      : blocks;

    if (reservations.length > 0) {
      throw new CourtBlockOverlapsReservationError({
        reservationIds: reservations.map((reservation) => reservation.id),
      });
    }

    if (filteredBlocks.length > 0) {
      throw new CourtBlockOverlapError({
        blockIds: filteredBlocks.map((block) => block.id),
      });
    }
  }

  private async computeWalkInPricing(
    courtId: string,
    startTime: Date,
    durationMinutes: number,
    timeZone: string | null,
    ctx?: RequestContext,
  ) {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const [hours, rules, overrides] = await Promise.all([
      this.courtHoursRepository.findByCourtIds([courtId], ctx),
      this.courtRateRuleRepository.findByCourtIds([courtId], ctx),
      this.courtPriceOverrideRepository.findOverlappingByCourtIds(
        [courtId],
        startTime,
        endTime,
        ctx,
      ),
    ]);

    const pricing = computeSchedulePrice({
      startTime,
      durationMinutes,
      timeZone,
      hoursWindows: hours,
      rateRules: rules,
      priceOverrides: overrides,
    });

    if (!pricing) {
      throw new CourtBlockPricingUnavailableError({
        courtId,
        startTime,
        durationMinutes,
      });
    }

    return pricing;
  }
}
