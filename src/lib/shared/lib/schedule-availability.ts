import { addMinutes } from "date-fns";
import { getZonedWeekdayMinuteOfDay } from "@/common/time-zone";
import type {
  CourtAddonRateRuleRecord,
  CourtAddonRecord,
  CourtHoursWindowRecord,
  CourtPriceOverrideRecord,
  CourtRateRuleRecord,
} from "@/lib/shared/infra/db/schema";

export type SchedulePricingResult = {
  endTime: Date;
  totalPriceCents: number;
  currency: string;
  warnings: SchedulePricingWarning[];
};

export type SchedulePricingWarning = {
  code: "AUTO_ADDON_PARTIAL_COVERAGE";
  addonId: string;
  addonLabel: string;
  message: string;
};

export type SchedulePricingFailureReason =
  | "INVALID_DURATION"
  | "HOURS_COVERAGE_MISSING"
  | "BASE_RATE_MISSING"
  | "BASE_CURRENCY_MISMATCH"
  | "ADDON_CURRENCY_MISMATCH"
  | "ADDON_CONFIGURATION_INVALID";

export type ScheduleAddon = {
  addon: CourtAddonRecord;
  rules: CourtAddonRateRuleRecord[];
};

export type SchedulePricingDetailedResult = {
  result: SchedulePricingResult | null;
  failureReason: SchedulePricingFailureReason | null;
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

function findMatchingAddonRule(options: {
  dayOfWeek: number;
  minuteOfDay: number;
  rules: CourtAddonRateRuleRecord[];
}): CourtAddonRateRuleRecord | null {
  const { dayOfWeek, minuteOfDay, rules } = options;
  const match = rules.find(
    (rule) =>
      rule.dayOfWeek === dayOfWeek &&
      rule.startMinute <= minuteOfDay &&
      rule.endMinute >= minuteOfDay + HOUR_MINUTES,
  );
  return match ?? null;
}

export function computeSchedulePriceDetailed(options: {
  startTime: Date;
  durationMinutes: number;
  timeZone?: string | null;
  hoursWindows: CourtHoursWindowRecord[];
  rateRules: CourtRateRuleRecord[];
  priceOverrides?: CourtPriceOverrideRecord[];
  addons?: ScheduleAddon[];
  selectedAddonIds?: string[];
  enableAddonPricing?: boolean;
}): SchedulePricingDetailedResult {
  const {
    startTime,
    durationMinutes,
    timeZone,
    hoursWindows,
    rateRules,
    priceOverrides,
    addons,
    selectedAddonIds,
    enableAddonPricing,
  } = options;

  if (durationMinutes <= 0 || durationMinutes % HOUR_MINUTES !== 0) {
    return { result: null, failureReason: "INVALID_DURATION" };
  }

  const endTime = addMinutes(startTime, durationMinutes);
  let cursor = new Date(startTime);
  let totalPriceCents = 0;
  let currency: string | null = null;

  const includeAddonPricing = enableAddonPricing !== false;
  const selectedAddonIdSet = new Set(selectedAddonIds ?? []);
  const appliedAddons = includeAddonPricing
    ? (addons ?? []).filter((item) => {
        if (!item.addon.isActive) return false;
        if (item.addon.mode === "AUTO") return true;
        if (item.addon.mode === "OPTIONAL") {
          return selectedAddonIdSet.has(item.addon.id);
        }
        return false;
      })
    : [];

  const chargedFlatAddons = new Set<string>();
  const warnedPartialCoverage = new Set<string>();
  const warnings: SchedulePricingWarning[] = [];

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
      return { result: null, failureReason: "HOURS_COVERAGE_MISSING" };
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
      return { result: null, failureReason: "BASE_RATE_MISSING" };
    }

    totalPriceCents += effective.hourlyRateCents;

    if (!currency) {
      currency = effective.currency;
    } else if (currency !== effective.currency) {
      return { result: null, failureReason: "BASE_CURRENCY_MISMATCH" };
    }

    for (const { addon, rules } of appliedAddons) {
      const matchingRule = findMatchingAddonRule({
        dayOfWeek,
        minuteOfDay,
        rules,
      });

      if (!matchingRule) {
        if (addon.mode === "AUTO" && !warnedPartialCoverage.has(addon.id)) {
          warnedPartialCoverage.add(addon.id);
          warnings.push({
            code: "AUTO_ADDON_PARTIAL_COVERAGE",
            addonId: addon.id,
            addonLabel: addon.label,
            message:
              "AUTO addon has uncovered schedule segments and contributes +0 where uncovered",
          });
        }
        continue;
      }

      if (addon.pricingType === "HOURLY") {
        if (
          matchingRule.hourlyRateCents === null ||
          matchingRule.currency === null
        ) {
          return {
            result: null,
            failureReason: "ADDON_CONFIGURATION_INVALID",
          };
        }

        if (currency && matchingRule.currency !== currency) {
          return { result: null, failureReason: "ADDON_CURRENCY_MISMATCH" };
        }

        totalPriceCents += matchingRule.hourlyRateCents;
        continue;
      }

      if (addon.pricingType === "FLAT") {
        if (chargedFlatAddons.has(addon.id)) {
          continue;
        }

        if (addon.flatFeeCents === null || addon.flatFeeCurrency === null) {
          return {
            result: null,
            failureReason: "ADDON_CONFIGURATION_INVALID",
          };
        }

        if (currency && addon.flatFeeCurrency !== currency) {
          return { result: null, failureReason: "ADDON_CURRENCY_MISMATCH" };
        }

        totalPriceCents += addon.flatFeeCents;
        chargedFlatAddons.add(addon.id);
      }
    }

    cursor = segmentEnd;
  }

  return {
    result: {
      endTime,
      totalPriceCents,
      currency: currency ?? "PHP",
      warnings,
    },
    failureReason: null,
  };
}

export function computeSchedulePrice(options: {
  startTime: Date;
  durationMinutes: number;
  timeZone?: string | null;
  hoursWindows: CourtHoursWindowRecord[];
  rateRules: CourtRateRuleRecord[];
  priceOverrides?: CourtPriceOverrideRecord[];
  addons?: ScheduleAddon[];
  selectedAddonIds?: string[];
  enableAddonPricing?: boolean;
}): SchedulePricingResult | null {
  return computeSchedulePriceDetailed(options).result;
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
