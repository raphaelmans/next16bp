import { differenceInMinutes } from "date-fns";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import type { ICourtRateRuleRepository } from "@/modules/court-rate-rule/repositories/court-rate-rule.repository";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type {
  CourtRateRuleRecord,
  CourtRecord,
  PlaceRecord,
  TimeSlotRecord,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import { getZonedWeekdayMinuteOfDay } from "@/shared/lib/time-zone";
import type {
  CreateBulkTimeSlotsDTO,
  CreateTimeSlotDTO,
  GetAvailableSlotsDTO,
  GetSlotsForCourtDTO,
  UpdateSlotPriceDTO,
} from "../dtos";
import {
  SlotInUseError,
  SlotNotAvailableError,
  SlotNotFoundError,
  SlotOverlapError,
  SlotPricingUnavailableError,
} from "../errors/time-slot.errors";
import type {
  ITimeSlotRepository,
  TimeSlotWithDetails,
  TimeSlotWithPlayerInfo,
} from "../repositories/time-slot.repository";

export interface ITimeSlotService {
  // Public queries
  getAvailableSlots(data: GetAvailableSlotsDTO): Promise<TimeSlotRecord[]>;
  getSlotById(slotId: string): Promise<TimeSlotWithDetails>;

  // Owner operations
  getSlotsForCourt(
    userId: string,
    data: GetSlotsForCourtDTO,
  ): Promise<TimeSlotWithPlayerInfo[]>;
  createSlot(userId: string, data: CreateTimeSlotDTO): Promise<TimeSlotRecord>;
  createBulkSlots(
    userId: string,
    data: CreateBulkTimeSlotsDTO,
  ): Promise<BulkSlotCreationResult>;
  blockSlot(userId: string, slotId: string): Promise<TimeSlotRecord>;
  unblockSlot(userId: string, slotId: string): Promise<TimeSlotRecord>;
  updateSlotPrice(
    userId: string,
    data: UpdateSlotPriceDTO,
  ): Promise<TimeSlotRecord>;
  deleteSlot(userId: string, slotId: string): Promise<void>;
}

export type BulkSlotCreationResult = {
  createdCount: number;
  attemptedCount: number;
  skippedPricingCount: number;
  skippedConflictCount: number;
};

export class TimeSlotService implements ITimeSlotService {
  constructor(
    private timeSlotRepository: ITimeSlotRepository,
    private courtRepository: ICourtRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  private requireCourtPlaceId(placeId: string | null): string {
    if (!placeId) {
      throw new NotCourtOwnerError();
    }
    return placeId;
  }

  /**
   * Verify that the user owns the court via organization ownership
   */
  private async verifyCourtOwnership(
    userId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    await this.getOwnedCourtAndPlace(userId, courtId, ctx);
  }

  private async getOwnedCourtAndPlace(
    userId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<{ court: CourtRecord; place: PlaceRecord }> {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    const placeId = this.requireCourtPlaceId(court.placeId);
    const place = await this.placeRepository.findById(placeId, ctx);
    if (!place || !place.organizationId) {
      throw new NotCourtOwnerError();
    }

    const org = await this.organizationRepository.findById(
      place.organizationId,
      ctx,
    );
    if (!org || org.ownerUserId !== userId) {
      throw new NotCourtOwnerError();
    }

    return { court, place };
  }

  /**
   * Verify user owns the slot's court
   */
  private async verifySlotOwnership(
    userId: string,
    slotId: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord> {
    const slot = await this.timeSlotRepository.findById(slotId, ctx);
    if (!slot) {
      throw new SlotNotFoundError(slotId);
    }

    await this.verifyCourtOwnership(userId, slot.courtId, ctx);
    return slot;
  }

  private async resolveSlotPricing(options: {
    courtId: string;
    startTime: Date;
    endTime: Date;
    priceCents?: number | null;
    currency?: string | null;
    ctx?: RequestContext;
  }): Promise<{ priceCents: number | null; currency: string | null }> {
    const { courtId, startTime, endTime, priceCents, currency, ctx } = options;

    if (priceCents === null && currency === null) {
      return { priceCents: null, currency: null };
    }

    if (priceCents !== undefined || currency !== undefined) {
      return { priceCents: priceCents ?? null, currency: currency ?? null };
    }

    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }
    const placeId = this.requireCourtPlaceId(court.placeId);
    const place = await this.placeRepository.findById(placeId, ctx);
    const { dayOfWeek, minuteOfDay } = getZonedWeekdayMinuteOfDay(
      startTime,
      place?.timeZone,
    );
    const rule = await this.courtRateRuleRepository.findMatchingRule(
      courtId,
      dayOfWeek,
      minuteOfDay,
      ctx,
    );

    if (!rule) {
      throw new SlotPricingUnavailableError(courtId, startTime, endTime);
    }

    const durationMinutes = differenceInMinutes(endTime, startTime);
    const multiplier = durationMinutes / 60;

    return {
      priceCents: rule.hourlyRateCents * multiplier,
      currency: rule.currency,
    };
  }

  private resolveSlotPricingFromRules(options: {
    startTime: Date;
    endTime: Date;
    priceCents?: number | null;
    currency?: string | null;
    rateRules: CourtRateRuleRecord[];
    timeZone?: string | null;
  }): { priceCents: number | null; currency: string | null } | null {
    const { startTime, endTime, priceCents, currency, rateRules, timeZone } =
      options;

    if (priceCents === null && currency === null) {
      return { priceCents: null, currency: null };
    }

    if (priceCents !== undefined || currency !== undefined) {
      return { priceCents: priceCents ?? null, currency: currency ?? null };
    }

    const { dayOfWeek, minuteOfDay } = getZonedWeekdayMinuteOfDay(
      startTime,
      timeZone ?? undefined,
    );
    const rule = rateRules.find(
      (candidate) =>
        candidate.dayOfWeek === dayOfWeek &&
        candidate.startMinute <= minuteOfDay &&
        candidate.endMinute >= minuteOfDay + 1,
    );

    if (!rule) {
      return null;
    }

    const durationMinutes = differenceInMinutes(endTime, startTime);
    const multiplier = durationMinutes / 60;

    return {
      priceCents: rule.hourlyRateCents * multiplier,
      currency: rule.currency,
    };
  }

  async getAvailableSlots(
    data: GetAvailableSlotsDTO,
  ): Promise<TimeSlotRecord[]> {
    return this.timeSlotRepository.findAvailable(
      data.courtId,
      new Date(data.startDate),
      new Date(data.endDate),
    );
  }

  async getSlotById(slotId: string): Promise<TimeSlotWithDetails> {
    const slot = await this.timeSlotRepository.findById(slotId);
    if (!slot) {
      throw new SlotNotFoundError(slotId);
    }
    return slot;
  }

  async getSlotsForCourt(
    userId: string,
    data: GetSlotsForCourtDTO,
  ): Promise<TimeSlotWithPlayerInfo[]> {
    // Verify ownership
    await this.verifyCourtOwnership(userId, data.courtId);

    return this.timeSlotRepository.findByCourtWithReservation(
      data.courtId,
      new Date(data.startDate),
      new Date(data.endDate),
    );
  }

  async createSlot(
    userId: string,
    data: CreateTimeSlotDTO,
  ): Promise<TimeSlotRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);

      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);

      // Check for overlapping slots
      const overlapping = await this.timeSlotRepository.findOverlapping(
        data.courtId,
        startTime,
        endTime,
        undefined,
        ctx,
      );

      if (overlapping.length > 0) {
        throw new SlotOverlapError(data.courtId, startTime, endTime);
      }

      const pricing = await this.resolveSlotPricing({
        courtId: data.courtId,
        startTime,
        endTime,
        priceCents: data.priceCents,
        currency: data.currency,
        ctx,
      });

      const slot = await this.timeSlotRepository.create(
        {
          courtId: data.courtId,
          startTime,
          endTime,
          priceCents: pricing.priceCents,
          currency: pricing.currency,
        },
        ctx,
      );

      logger.info(
        {
          event: "time_slot.created",
          slotId: slot.id,
          courtId: data.courtId,
          userId,
        },
        "Time slot created",
      );

      return slot;
    });
  }

  async createBulkSlots(
    userId: string,
    data: CreateBulkTimeSlotsDTO,
  ): Promise<BulkSlotCreationResult> {
    const { court, place } = await this.getOwnedCourtAndPlace(
      userId,
      data.courtId,
    );

    const rateRules = await this.courtRateRuleRepository.findByCourtId(
      data.courtId,
    );

    const slotsToCreate: {
      courtId: string;
      startTime: Date;
      endTime: Date;
      priceCents: number | null;
      currency: string | null;
    }[] = [];
    let skippedPricingCount = 0;

    for (const slotData of data.slots) {
      const startTime = new Date(slotData.startTime);
      const endTime = new Date(slotData.endTime);

      const pricing = this.resolveSlotPricingFromRules({
        startTime,
        endTime,
        priceCents: slotData.priceCents,
        currency: slotData.currency,
        rateRules,
        timeZone: place.timeZone,
      });

      if (!pricing) {
        skippedPricingCount += 1;
        continue;
      }

      slotsToCreate.push({
        courtId: court.id,
        startTime,
        endTime,
        priceCents: pricing.priceCents,
        currency: pricing.currency,
      });
    }

    const attemptedCount = slotsToCreate.length;
    let createdCount = 0;

    if (attemptedCount > 0) {
      const createdSlots = await this.transactionManager.run(async (tx) => {
        const ctx: RequestContext = { tx };
        return this.timeSlotRepository.createManyBestEffort(slotsToCreate, ctx);
      });
      createdCount = createdSlots.length;
    }

    const skippedConflictCount = attemptedCount - createdCount;

    logger.info(
      {
        event: "time_slots.bulk_created",
        courtId: court.id,
        attemptedCount,
        createdCount,
        skippedPricingCount,
        skippedConflictCount,
        userId,
      },
      "Bulk time slots created",
    );

    return {
      createdCount,
      attemptedCount,
      skippedPricingCount,
      skippedConflictCount,
    };
  }

  async blockSlot(userId: string, slotId: string): Promise<TimeSlotRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const slot = await this.verifySlotOwnership(userId, slotId, ctx);

      if (slot.status !== "AVAILABLE") {
        throw new SlotNotAvailableError(slotId, slot.status);
      }

      const updated = await this.timeSlotRepository.update(
        slotId,
        { status: "BLOCKED" },
        ctx,
      );

      logger.info(
        {
          event: "time_slot.blocked",
          slotId,
          courtId: slot.courtId,
          userId,
        },
        "Time slot blocked",
      );

      return updated;
    });
  }

  async unblockSlot(userId: string, slotId: string): Promise<TimeSlotRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const slot = await this.verifySlotOwnership(userId, slotId, ctx);

      if (slot.status !== "BLOCKED") {
        throw new SlotNotAvailableError(slotId, slot.status);
      }

      const updated = await this.timeSlotRepository.update(
        slotId,
        { status: "AVAILABLE" },
        ctx,
      );

      logger.info(
        {
          event: "time_slot.unblocked",
          slotId,
          courtId: slot.courtId,
          userId,
        },
        "Time slot unblocked",
      );

      return updated;
    });
  }

  async updateSlotPrice(
    userId: string,
    data: UpdateSlotPriceDTO,
  ): Promise<TimeSlotRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const slot = await this.verifySlotOwnership(userId, data.slotId, ctx);

      if (slot.status !== "AVAILABLE") {
        throw new SlotNotAvailableError(data.slotId, slot.status);
      }

      const updated = await this.timeSlotRepository.update(
        data.slotId,
        {
          priceCents: data.priceCents,
          currency: data.currency,
        },
        ctx,
      );

      logger.info(
        {
          event: "time_slot.price_updated",
          slotId: data.slotId,
          courtId: slot.courtId,
          priceCents: data.priceCents,
          currency: data.currency,
          userId,
        },
        "Time slot price updated",
      );

      return updated;
    });
  }

  async deleteSlot(userId: string, slotId: string): Promise<void> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      const slot = await this.verifySlotOwnership(userId, slotId, ctx);

      if (slot.status !== "AVAILABLE") {
        throw new SlotInUseError(slotId, slot.status);
      }

      await this.timeSlotRepository.delete(slotId, ctx);

      logger.info(
        {
          event: "time_slot.deleted",
          slotId,
          courtId: slot.courtId,
          userId,
        },
        "Time slot deleted",
      );
    });
  }
}
