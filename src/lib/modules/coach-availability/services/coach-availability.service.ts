import { addDays } from "date-fns";
import type { PricingBreakdown } from "@/common/pricing-breakdown";
import {
  getZonedDate,
  getZonedDayRangeForInstant,
  toUtcISOString,
} from "@/common/time-zone";
import { env } from "@/lib/env";
import {
  CoachNotActiveError,
  CoachNotFoundError,
} from "@/lib/modules/coach/errors/coach.errors";
import type { ICoachRepository } from "@/lib/modules/coach/repositories/coach.repository";
import type { ICoachAddonRepository } from "@/lib/modules/coach-addon/repositories/coach-addon.repository";
import type { ICoachBlockRepository } from "@/lib/modules/coach-block/repositories/coach-block.repository";
import type { ICoachHoursRepository } from "@/lib/modules/coach-hours/repositories/coach-hours.repository";
import type { ICoachRateRuleRepository } from "@/lib/modules/coach-rate-rule/repositories/coach-rate-rule.repository";
import type { IReservationRepository } from "@/lib/modules/reservation/repositories/reservation.repository";
import type {
  CoachAddonRateRuleRecord,
  CoachAddonRecord,
  CoachBlockRecord,
  CoachHoursWindowRecord,
  CoachRateRuleRecord,
  CoachRecord,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import {
  computeSchedulePriceDetailed,
  rangesOverlap,
  type ScheduleAddon,
  type ScheduleHoursWindow,
} from "@/lib/shared/lib/schedule-availability";
import { getInvalidSelectedAddonIds } from "@/lib/shared/lib/selected-addon-validation";
import type {
  CoachAvailabilityDiagnosticsDTO,
  GetCoachAvailabilityDTO,
  GetCoachAvailabilityRangeDTO,
} from "../dtos";
import { InvalidCoachAvailabilityAddonSelectionError } from "../errors/coach-availability.errors";

export interface CoachAvailabilityOption {
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency: string | null;
  coachId: string;
  coachName: string;
  status: "AVAILABLE" | "BOOKED";
  unavailableReason?: "RESERVATION" | "BLOCK" | null;
  pricingWarnings?: string[];
  pricingBreakdown?: PricingBreakdown;
}

export interface CoachAvailabilityResult {
  options: CoachAvailabilityOption[];
  diagnostics: CoachAvailabilityDiagnosticsDTO;
}

export interface ICoachAvailabilityService {
  getForCoach(data: GetCoachAvailabilityDTO): Promise<CoachAvailabilityResult>;
  getForCoachRange(
    data: GetCoachAvailabilityRangeDTO,
  ): Promise<CoachAvailabilityResult>;
}

const SLOT_STEP_MINUTES = 60;

export class CoachAvailabilityService implements ICoachAvailabilityService {
  constructor(
    private coachRepository: ICoachRepository,
    private coachHoursRepository: ICoachHoursRepository,
    private coachRateRuleRepository: ICoachRateRuleRepository,
    private coachAddonRepository: ICoachAddonRepository,
    private reservationRepository: IReservationRepository,
    private coachBlockRepository: ICoachBlockRepository,
  ) {}

  async getForCoach(
    data: GetCoachAvailabilityDTO,
  ): Promise<CoachAvailabilityResult> {
    const coach = await this.getActiveCoach(data.coachId);
    const { start, end } = getZonedDayRangeForInstant(
      data.date,
      coach.timeZone,
    );

    return this.getAvailabilityForRange({
      coach,
      rangeStart: start,
      rangeEnd: end,
      durationMinutes: data.durationMinutes,
      selectedAddons: data.selectedAddons,
      includeUnavailable: data.includeUnavailable ?? false,
    });
  }

  async getForCoachRange(
    data: GetCoachAvailabilityRangeDTO,
  ): Promise<CoachAvailabilityResult> {
    const coach = await this.getActiveCoach(data.coachId);

    return this.getAvailabilityForRange({
      coach,
      rangeStart: new Date(data.startDate),
      rangeEnd: new Date(data.endDate),
      durationMinutes: data.durationMinutes,
      selectedAddons: data.selectedAddons,
      includeUnavailable: data.includeUnavailable ?? false,
    });
  }

  private async getAvailabilityForRange(options: {
    coach: CoachRecord;
    rangeStart: Date;
    rangeEnd: Date;
    durationMinutes: number;
    selectedAddons?: { addonId: string; quantity: number }[];
    includeUnavailable: boolean;
  }): Promise<CoachAvailabilityResult> {
    const {
      coach,
      rangeStart,
      rangeEnd,
      durationMinutes,
      selectedAddons,
      includeUnavailable,
    } = options;

    const [hours, rules, addons] = await Promise.all([
      this.coachHoursRepository.findByCoachId(coach.id),
      this.coachRateRuleRepository.findByCoachId(coach.id),
      this.coachAddonRepository.findActiveByCoachIds([coach.id]),
    ]);

    const extendedEnd = this.computeOvernightExtension(
      rangeEnd,
      coach.timeZone,
      hours,
    );

    const [reservations, blocks, addonRules] = await Promise.all([
      this.reservationRepository.findOverlappingActiveByCoachIds(
        [coach.id],
        rangeStart,
        extendedEnd,
      ),
      this.coachBlockRepository.findOverlappingByCoachId(
        coach.id,
        rangeStart,
        extendedEnd,
      ),
      this.coachAddonRepository.findRateRulesByAddonIds(
        addons.map((addon) => addon.id),
      ),
    ]);

    const invalidAddonIds = this.getInvalidSelectedAddonIdsForCoach({
      selectedAddons,
      coachAddons: addons,
    });
    if (invalidAddonIds.length > 0) {
      throw new InvalidCoachAvailabilityAddonSelectionError({
        coachId: coach.id,
        invalidAddonIds,
      });
    }

    return this.buildAvailabilityForCoachRange({
      coach,
      rangeStart,
      rangeEnd: extendedEnd,
      durationMinutes,
      hours,
      rules,
      addons,
      addonRules,
      reservations,
      blocks,
      selectedAddons,
      includeUnavailable,
    });
  }

  private async getActiveCoach(coachId: string): Promise<CoachRecord> {
    const coach = await this.coachRepository.findById(coachId);
    if (!coach) {
      throw new CoachNotFoundError(coachId);
    }
    if (!coach.isActive) {
      throw new CoachNotActiveError(coach.id);
    }
    return coach;
  }

  private isReservationBlocking(reservation: ReservationRecord): boolean {
    if (
      reservation.status === "CANCELLED" ||
      reservation.status === "EXPIRED"
    ) {
      return false;
    }
    if (reservation.status === "CONFIRMED") {
      return true;
    }
    if (!reservation.expiresAt) {
      return true;
    }
    return new Date(reservation.expiresAt) > new Date();
  }

  private getInvalidSelectedAddonIdsForCoach(options: {
    selectedAddons?: { addonId: string; quantity: number }[];
    coachAddons: CoachAddonRecord[];
  }): string[] {
    const allowedAddonIds = new Set<string>();
    for (const addon of options.coachAddons) {
      if (addon.isActive) {
        allowedAddonIds.add(addon.id);
      }
    }

    return getInvalidSelectedAddonIds({
      selectedAddons: options.selectedAddons,
      allowedAddonIds,
    });
  }

  private computeOvernightExtension(
    rangeEnd: Date,
    timeZone: string,
    hoursWindows: ScheduleHoursWindow[],
  ): Date {
    const rangeEndDayStart = getZonedDayRangeForInstant(
      rangeEnd,
      timeZone,
    ).start;
    const nextDayStart = addDays(rangeEndDayStart, 1);
    const nextDayOfWeek = getZonedDate(nextDayStart, timeZone).getDay();

    const nextDayWindows = hoursWindows
      .filter((window) => window.dayOfWeek === nextDayOfWeek)
      .sort((a, b) => a.startMinute - b.startMinute);

    let contiguousEnd = 0;
    for (const window of nextDayWindows) {
      if (window.startMinute > contiguousEnd) break;
      contiguousEnd = Math.max(contiguousEnd, window.endMinute);
    }

    if (contiguousEnd === 0) return rangeEnd;

    return new Date(nextDayStart.getTime() + contiguousEnd * 60_000);
  }

  private buildAvailabilityForCoachRange(options: {
    coach: CoachRecord;
    rangeStart: Date;
    rangeEnd: Date;
    durationMinutes: number;
    hours: CoachHoursWindowRecord[];
    rules: CoachRateRuleRecord[];
    addons: CoachAddonRecord[];
    addonRules: CoachAddonRateRuleRecord[];
    reservations: ReservationRecord[];
    blocks: CoachBlockRecord[];
    selectedAddons?: { addonId: string; quantity: number }[];
    includeUnavailable?: boolean;
  }): CoachAvailabilityResult {
    const {
      coach,
      rangeStart,
      rangeEnd,
      durationMinutes,
      hours,
      rules,
      addons,
      addonRules,
      reservations,
      blocks,
      selectedAddons,
      includeUnavailable,
    } = options;

    const diagnostics: CoachAvailabilityDiagnosticsDTO = {
      hasHoursWindows: hours.length > 0,
      hasRateRules: rules.length > 0,
      dayHasHours: false,
      allSlotsBooked: false,
    };

    if (durationMinutes <= 0) {
      return { options: [], diagnostics };
    }

    if (hours.length === 0 || rules.length === 0) {
      return { options: [], diagnostics };
    }

    const coachAddons: ScheduleAddon[] = addons.map((addon) => ({
      addon,
      rules: addonRules.filter((rule) => rule.addonId === addon.id),
    }));
    const coachReservations = reservations
      .filter((reservation) => reservation.coachId === coach.id)
      .filter((reservation) => this.isReservationBlocking(reservation));
    const coachBlocks = blocks.filter((block) => block.coachId === coach.id);

    const rangeStartDay = getZonedDayRangeForInstant(
      rangeStart,
      coach.timeZone,
    ).start;
    const rangeEndDay = getZonedDayRangeForInstant(
      rangeEnd,
      coach.timeZone,
    ).start;

    const results: CoachAvailabilityOption[] = [];
    const dayCursor = getZonedDate(rangeStartDay, coach.timeZone);
    let anyDayHasHours = false;
    let totalSlotsGenerated = 0;
    let bookedSlotsCount = 0;
    let hasAddonCurrencyMismatch = false;

    while (dayCursor <= rangeEndDay) {
      const dayStart = getZonedDayRangeForInstant(
        dayCursor,
        coach.timeZone,
      ).start;
      const dayOfWeek = dayStart.getDay();
      const dayWindows = hours.filter(
        (window) => window.dayOfWeek === dayOfWeek,
      );

      if (dayWindows.length === 0) {
        dayCursor.setDate(dayCursor.getDate() + 1);
        continue;
      }
      anyDayHasHours = true;

      const startMinutes = new Set<number>();
      for (const window of dayWindows) {
        for (
          let minute = window.startMinute;
          minute + SLOT_STEP_MINUTES <= window.endMinute;
          minute += SLOT_STEP_MINUTES
        ) {
          startMinutes.add(minute);
        }
      }

      const sortedMinutes = Array.from(startMinutes).sort((a, b) => a - b);

      for (const minute of sortedMinutes) {
        const startTime = getZonedDate(dayStart, coach.timeZone);
        startTime.setHours(Math.floor(minute / 60), minute % 60, 0, 0);

        const pricingDetailed = computeSchedulePriceDetailed({
          startTime,
          durationMinutes,
          timeZone: coach.timeZone,
          hoursWindows: hours,
          rateRules: rules,
          addons: coachAddons,
          selectedAddons,
          enableAddonPricing: env.ENABLE_ADDON_PRICING_V2 !== false,
        });
        const pricing = pricingDetailed.result;

        if (!pricing) {
          if (pricingDetailed.failureReason === "ADDON_CURRENCY_MISMATCH") {
            hasAddonCurrencyMismatch = true;
          }
          continue;
        }

        if (pricing.warnings.length > 0) {
          logger.warn(
            {
              event: "coach_availability.pricing_addon_warnings",
              coachId: coach.id,
              warningCodes: pricing.warnings.map((warning) => warning.code),
              warningCount: pricing.warnings.length,
            },
            "Coach availability pricing completed with addon warnings",
          );
        }

        const endTime = pricing.endTime;
        if (startTime < rangeStart || endTime > rangeEnd) {
          continue;
        }

        const reservationOverlap = coachReservations.find((reservation) =>
          rangesOverlap({
            startA: startTime,
            endA: endTime,
            startB: new Date(reservation.startTime),
            endB: new Date(reservation.endTime),
          }),
        );
        const blockOverlap = coachBlocks.find((block) =>
          rangesOverlap({
            startA: startTime,
            endA: endTime,
            startB: new Date(block.startTime),
            endB: new Date(block.endTime),
          }),
        );

        const isUnavailable = Boolean(reservationOverlap || blockOverlap);
        totalSlotsGenerated += 1;
        if (isUnavailable) {
          bookedSlotsCount += 1;
        }

        if (isUnavailable && !includeUnavailable) {
          continue;
        }

        results.push({
          startTime: toUtcISOString(startTime),
          endTime: toUtcISOString(endTime),
          totalPriceCents: pricing.totalPriceCents,
          currency: pricing.currency,
          coachId: coach.id,
          coachName: coach.name,
          status: isUnavailable ? "BOOKED" : "AVAILABLE",
          unavailableReason: reservationOverlap
            ? "RESERVATION"
            : blockOverlap
              ? "BLOCK"
              : null,
          pricingWarnings: pricing.warnings.map((warning) => warning.message),
          pricingBreakdown: pricing.pricingBreakdown,
        });
      }

      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    diagnostics.dayHasHours = anyDayHasHours;
    diagnostics.allSlotsBooked =
      totalSlotsGenerated > 0 && bookedSlotsCount === totalSlotsGenerated;

    if (hasAddonCurrencyMismatch) {
      logger.warn(
        {
          event: "coach_availability.pricing_addon_currency_mismatch",
          coachId: coach.id,
          rangeStart: rangeStart.toISOString(),
          rangeEnd: rangeEnd.toISOString(),
        },
        "Coach availability encountered addon currency mismatch",
      );
    }

    return {
      options: results.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      diagnostics,
    };
  }
}
