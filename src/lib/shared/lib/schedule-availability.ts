import { addMinutes } from "date-fns";
import type {
  PricingBreakdown,
  PricingBreakdownAddonLine,
} from "@/common/pricing-breakdown";
import { getZonedWeekdayMinuteOfDay } from "@/common/time-zone";

export type SchedulePricingResult = {
  endTime: Date;
  totalPriceCents: number;
  currency: string;
  pricingBreakdown: PricingBreakdown;
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

/**
 * Minimal hours-window shape required by the pricing engine.
 * Satisfied structurally by both CourtHoursWindowRecord and CoachHoursWindowRecord.
 */
export type ScheduleHoursWindow = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

/**
 * Minimal rate-rule shape required by the pricing engine.
 * Satisfied structurally by both CourtRateRuleRecord and CoachRateRuleRecord.
 */
export type ScheduleRateRule = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  hourlyRateCents: number;
  currency: string;
};

/**
 * Minimal price-override shape required by the pricing engine.
 * Currently used by courts only, but kept generic so the helper remains domain-agnostic.
 */
export type SchedulePriceOverride = {
  startTime: Date | string;
  endTime: Date | string;
  hourlyRateCents: number;
  currency: string;
};

/**
 * Minimal addon shape required by the pricing engine.
 * Satisfied structurally by both CourtAddonRecord and PlaceAddonRecord.
 */
export type PricingAddon = {
  id: string;
  isActive: boolean;
  mode: "OPTIONAL" | "AUTO";
  pricingType: "HOURLY" | "FLAT";
  flatFeeCents: number | null;
  flatFeeCurrency: string | null;
  label: string;
};

/**
 * Minimal rate-rule shape required by the pricing engine.
 * Satisfied structurally by both CourtAddonRateRuleRecord and PlaceAddonRateRuleRecord.
 */
export type PricingAddonRule = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  hourlyRateCents: number | null;
  currency: string | null;
};

export type ScheduleAddon = {
  addon: PricingAddon;
  rules: PricingAddonRule[];
};

export type SelectedAddon = {
  addonId: string;
  quantity: number;
};

export type SchedulePricingDetailedResult = {
  result: SchedulePricingResult | null;
  failureReason: SchedulePricingFailureReason | null;
};

const HOUR_MINUTES = 60;

function isHourCoveredByHoursWindows(options: {
  dayOfWeek: number;
  minuteOfDay: number;
  hoursWindows: ScheduleHoursWindow[];
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
  rateRules: ScheduleRateRule[];
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
  overrides?: SchedulePriceOverride[];
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
  rules: PricingAddonRule[];
}): PricingAddonRule | null {
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
  hoursWindows: ScheduleHoursWindow[];
  rateRules: ScheduleRateRule[];
  priceOverrides?: SchedulePriceOverride[];
  addons?: ScheduleAddon[];
  venueAddons?: ScheduleAddon[];
  selectedAddons?: SelectedAddon[];
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
    venueAddons,
    selectedAddons,
    enableAddonPricing,
  } = options;

  if (durationMinutes <= 0 || durationMinutes % HOUR_MINUTES !== 0) {
    return { result: null, failureReason: "INVALID_DURATION" };
  }

  const endTime = addMinutes(startTime, durationMinutes);
  let cursor = new Date(startTime);
  let totalPriceCents = 0;
  let basePriceCents = 0;
  let currency: string | null = null;
  const addonLineById = new Map<string, PricingBreakdownAddonLine>();

  const appendAddonSubtotal = (
    addon: PricingAddon,
    quantity: number,
    subtotalCents: number,
  ) => {
    const existing = addonLineById.get(addon.id);
    if (existing) {
      existing.subtotalCents += subtotalCents;
      existing.quantity = Math.max(existing.quantity, quantity);
      return;
    }

    addonLineById.set(addon.id, {
      addonId: addon.id,
      addonLabel: addon.label,
      pricingType: addon.pricingType,
      quantity,
      subtotalCents,
    });
  };

  const includeAddonPricing = enableAddonPricing !== false;
  const selectedAddonQuantityMap = new Map<string, number>(
    (selectedAddons ?? []).map((s) => [
      s.addonId,
      Math.max(1, Math.trunc(s.quantity)),
    ]),
  );
  // GLOBAL (venue) add-ons first, then SPECIFIC (court) add-ons
  const allAddons = [...(venueAddons ?? []), ...(addons ?? [])];
  const appliedAddons = includeAddonPricing
    ? allAddons.filter((item) => {
        if (!item.addon.isActive) return false;
        if (item.addon.mode === "AUTO") return true;
        if (item.addon.mode === "OPTIONAL") {
          return selectedAddonQuantityMap.has(item.addon.id);
        }
        return false;
      })
    : [];

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
    basePriceCents += effective.hourlyRateCents;

    if (!currency) {
      currency = effective.currency;
    } else if (currency !== effective.currency) {
      return { result: null, failureReason: "BASE_CURRENCY_MISMATCH" };
    }

    for (const { addon, rules } of appliedAddons) {
      // FLAT add-ons are processed unconditionally after the loop
      if (addon.pricingType === "FLAT") continue;

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

      const quantity =
        addon.mode === "AUTO"
          ? 1
          : (selectedAddonQuantityMap.get(addon.id) ?? 1);

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

      const addonSubtotal = matchingRule.hourlyRateCents * quantity;
      totalPriceCents += addonSubtotal;
      appendAddonSubtotal(addon, quantity, addonSubtotal);
    }

    cursor = segmentEnd;
  }

  // Process FLAT add-ons unconditionally — charged once per booking regardless of windows
  for (const { addon } of appliedAddons) {
    if (addon.pricingType !== "FLAT") continue;

    if (addon.flatFeeCents === null || addon.flatFeeCurrency === null) {
      return { result: null, failureReason: "ADDON_CONFIGURATION_INVALID" };
    }

    if (currency && addon.flatFeeCurrency !== currency) {
      return { result: null, failureReason: "ADDON_CURRENCY_MISMATCH" };
    }

    const quantity =
      addon.mode === "AUTO" ? 1 : (selectedAddonQuantityMap.get(addon.id) ?? 1);
    const addonSubtotal = addon.flatFeeCents * quantity;
    totalPriceCents += addonSubtotal;
    appendAddonSubtotal(addon, quantity, addonSubtotal);
  }

  const addonLines = Array.from(addonLineById.values());
  const addonPriceCents = addonLines.reduce(
    (sum, line) => sum + line.subtotalCents,
    0,
  );

  return {
    result: {
      endTime,
      totalPriceCents,
      currency: currency ?? "PHP",
      pricingBreakdown: {
        basePriceCents,
        addonPriceCents,
        totalPriceCents,
        addons: addonLines,
      },
      warnings,
    },
    failureReason: null,
  };
}

export function computeSchedulePrice(options: {
  startTime: Date;
  durationMinutes: number;
  timeZone?: string | null;
  hoursWindows: ScheduleHoursWindow[];
  rateRules: ScheduleRateRule[];
  priceOverrides?: SchedulePriceOverride[];
  addons?: ScheduleAddon[];
  venueAddons?: ScheduleAddon[];
  selectedAddons?: SelectedAddon[];
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
