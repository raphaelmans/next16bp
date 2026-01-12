import { differenceInMinutes, getDay } from "date-fns";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import type { ICourtRateRuleRepository } from "@/modules/court-rate-rule/repositories/court-rate-rule.repository";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { TimeSlotRecord } from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
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
  TimeSlotWithPaymentDetails,
  TimeSlotWithPlayerInfo,
} from "../repositories/time-slot.repository";

export interface ITimeSlotService {
  // Public queries
  getAvailableSlots(data: GetAvailableSlotsDTO): Promise<TimeSlotRecord[]>;
  getSlotById(slotId: string): Promise<TimeSlotWithPaymentDetails>;

  // Owner operations
  getSlotsForCourt(
    userId: string,
    data: GetSlotsForCourtDTO,
  ): Promise<TimeSlotWithPlayerInfo[]>;
  createSlot(userId: string, data: CreateTimeSlotDTO): Promise<TimeSlotRecord>;
  createBulkSlots(
    userId: string,
    data: CreateBulkTimeSlotsDTO,
  ): Promise<TimeSlotRecord[]>;
  blockSlot(userId: string, slotId: string): Promise<TimeSlotRecord>;
  unblockSlot(userId: string, slotId: string): Promise<TimeSlotRecord>;
  updateSlotPrice(
    userId: string,
    data: UpdateSlotPriceDTO,
  ): Promise<TimeSlotRecord>;
  deleteSlot(userId: string, slotId: string): Promise<void>;
}

export class TimeSlotService implements ITimeSlotService {
  constructor(
    private timeSlotRepository: ITimeSlotRepository,
    private courtRepository: ICourtRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private transactionManager: TransactionManager,
  ) {}

  /**
   * Verify that the user owns the court via organization ownership
   */
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

    const org = await this.organizationRepository.findById(
      place.organizationId,
      ctx,
    );
    if (!org || org.ownerUserId !== userId) {
      throw new NotCourtOwnerError();
    }
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

    const dayOfWeek = getDay(startTime);
    const minuteOfDay = startTime.getHours() * 60 + startTime.getMinutes();
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

  async getAvailableSlots(
    data: GetAvailableSlotsDTO,
  ): Promise<TimeSlotRecord[]> {
    return this.timeSlotRepository.findAvailable(
      data.courtId,
      new Date(data.startDate),
      new Date(data.endDate),
    );
  }

  async getSlotById(slotId: string): Promise<TimeSlotWithPaymentDetails> {
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
  ): Promise<TimeSlotRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      await this.verifyCourtOwnership(userId, data.courtId, ctx);

      // Validate all slots and check for overlaps
      const slotsToCreate = [];
      for (const slotData of data.slots) {
        const startTime = new Date(slotData.startTime);
        const endTime = new Date(slotData.endTime);

        // Check for overlapping with existing slots
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
          priceCents: slotData.priceCents,
          currency: slotData.currency,
          ctx,
        });

        slotsToCreate.push({
          courtId: data.courtId,
          startTime,
          endTime,
          priceCents: pricing.priceCents,
          currency: pricing.currency,
        });
      }

      // Also check for overlaps among the new slots themselves
      for (let i = 0; i < slotsToCreate.length; i++) {
        for (let j = i + 1; j < slotsToCreate.length; j++) {
          const slotA = slotsToCreate[i];
          const slotB = slotsToCreate[j];

          // Check if A and B overlap
          if (
            slotA.startTime < slotB.endTime &&
            slotA.endTime > slotB.startTime
          ) {
            throw new SlotOverlapError(
              data.courtId,
              slotA.startTime,
              slotA.endTime,
            );
          }
        }
      }

      const slots = await this.timeSlotRepository.createMany(
        slotsToCreate,
        ctx,
      );

      logger.info(
        {
          event: "time_slots.bulk_created",
          courtId: data.courtId,
          count: slots.length,
          userId,
        },
        "Bulk time slots created",
      );

      return slots;
    });
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
