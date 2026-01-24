import { addMinutes } from "date-fns";
import type {
  CourtHoursWindowRecord,
  CourtPriceOverrideRecord,
  CourtRateRuleRecord,
} from "@/shared/infra/db/schema";
import { getZonedWeekdayMinuteOfDay } from "@/shared/lib/time-zone";

export type SchedulePricingResult = {
  endTime: Date;
  totalPriceCents: number;
  currency: string;
};

const HOUR_MINUTES = 60;

function isHourCoveredByHoursWindows(options: {
  dayOfWeek: number;
  minuteOfDay: number;
  hoursWindows: CourtHoursWindowRecord[];
}): boolean {
  const { dayOfWeek, minuteOfDay, hoursWindows } = options;
  return hoursWindows.some(
    (window) =>
      window.dayOfWeek === dayOfWeek &&
      window.startMinute <= minuteOfDay &&
      window.endMinute >= minuteOfDay + HOUR_MINUTES,
  );
}

function findHourlyRateFromRules(options: {
  dayOfWeek: number;
  minuteOfDay: number;
  rateRules: CourtRateRuleRecord[];
}): { hourlyRateCents: number; currency: string } | null {
  const { dayOfWeek, minuteOfDay, rateRules } = options;
  const rule = rateRules.find(
    (candidate) =>
      candidate.dayOfWeek === dayOfWeek &&
      candidate.startMinute <= minuteOfDay &&
      candidate.endMinute >= minuteOfDay + HOUR_MINUTES,
  );
  if (!rule) return null;
  return { hourlyRateCents: rule.hourlyRateCents, currency: rule.currency };
}

function findHourlyRateFromOverrides(options: {
  segmentStart: Date;
  segmentEnd: Date;
  overrides?: CourtPriceOverrideRecord[];
}): { hourlyRateCents: number; currency: string } | null {
  const { segmentStart, segmentEnd, overrides } = options;
  if (!overrides || overrides.length === 0) return null;

  const match = overrides.find(
    (override) =>
      override.startTime <= segmentStart && override.endTime >= segmentEnd,
  );

  if (!match) return null;
  return { hourlyRateCents: match.hourlyRateCents, currency: match.currency };
}

export function computeSchedulePrice(options: {
  startTime: Date;
  durationMinutes: number;
  timeZone?: string | null;
  hoursWindows: CourtHoursWindowRecord[];
  rateRules: CourtRateRuleRecord[];
  priceOverrides?: CourtPriceOverrideRecord[];
}): SchedulePricingResult | null {
  const {
    startTime,
    durationMinutes,
    timeZone,
    hoursWindows,
    rateRules,
    priceOverrides,
  } = options;

  if (durationMinutes <= 0 || durationMinutes % HOUR_MINUTES !== 0) {
    return null;
  }

  const endTime = addMinutes(startTime, durationMinutes);
  let cursor = new Date(startTime);
  let totalPriceCents = 0;
  let currency: string | null = null;

  while (cursor < endTime) {
    const segmentStart = cursor;
    const segmentEnd = addMinutes(segmentStart, HOUR_MINUTES);
    const { dayOfWeek, minuteOfDay } = getZonedWeekdayMinuteOfDay(
      segmentStart,
      timeZone ?? undefined,
    );

    if (
      !isHourCoveredByHoursWindows({ dayOfWeek, minuteOfDay, hoursWindows })
    ) {
      return null;
    }

    const overrideRate = findHourlyRateFromOverrides({
      segmentStart,
      segmentEnd,
      overrides: priceOverrides,
    });
    const baseRate = overrideRate
      ? null
      : findHourlyRateFromRules({ dayOfWeek, minuteOfDay, rateRules });
    const effective = overrideRate ?? baseRate;

    if (!effective) {
      return null;
    }

    totalPriceCents += effective.hourlyRateCents;

    if (!currency) {
      currency = effective.currency;
    } else if (currency !== effective.currency) {
      return null;
    }

    cursor = segmentEnd;
  }

  return {
    endTime,
    totalPriceCents,
    currency: currency ?? "PHP",
  };
}

export function rangesOverlap(options: {
  startA: Date;
  endA: Date;
  startB: Date;
  endB: Date;
}): boolean {
  const { startA, endA, startB, endB } = options;
  return startA < endB && endA > startB;
}
