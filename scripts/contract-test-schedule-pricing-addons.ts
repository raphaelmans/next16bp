import assert from "node:assert/strict";
import type {
  CourtAddonRateRuleRecord,
  CourtAddonRecord,
  CourtHoursWindowRecord,
  CourtRateRuleRecord,
} from "../src/lib/shared/infra/db/schema";
import { computeSchedulePriceDetailed } from "../src/lib/shared/lib/schedule-availability";

const now = new Date("2026-01-05T00:00:00.000Z");
const courtId = "11111111-1111-1111-1111-111111111111";

const makeHours = (): CourtHoursWindowRecord[] => [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    courtId,
    dayOfWeek: 1,
    startMinute: 540,
    endMinute: 660,
    createdAt: now,
    updatedAt: now,
  },
];

const makeBaseRules = (): CourtRateRuleRecord[] => [
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    courtId,
    dayOfWeek: 1,
    startMinute: 540,
    endMinute: 660,
    currency: "PHP",
    hourlyRateCents: 1000,
    createdAt: now,
    updatedAt: now,
  },
];

const makeAddon = (input: {
  id: string;
  mode: CourtAddonRecord["mode"];
  pricingType: CourtAddonRecord["pricingType"];
  flatFeeCents?: number | null;
  flatFeeCurrency?: string | null;
}): CourtAddonRecord => ({
  id: input.id,
  courtId,
  label: `addon-${input.id.slice(0, 4)}`,
  isActive: true,
  mode: input.mode,
  pricingType: input.pricingType,
  flatFeeCents: input.flatFeeCents ?? null,
  flatFeeCurrency: input.flatFeeCurrency ?? null,
  displayOrder: 0,
  createdAt: now,
  updatedAt: now,
});

const makeRule = (input: {
  id: string;
  addonId: string;
  startMinute: number;
  endMinute: number;
  hourlyRateCents?: number | null;
  currency?: string | null;
}): CourtAddonRateRuleRecord => ({
  id: input.id,
  addonId: input.addonId,
  dayOfWeek: 1,
  startMinute: input.startMinute,
  endMinute: input.endMinute,
  hourlyRateCents: input.hourlyRateCents ?? null,
  currency: input.currency ?? null,
  createdAt: now,
  updatedAt: now,
});

const main = () => {
  const startTime = new Date("2026-01-05T09:00:00.000Z");

  const optionalAddon = makeAddon({
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    mode: "OPTIONAL",
    pricingType: "HOURLY",
  });

  const optionalAddonRules = [
    makeRule({
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      addonId: optionalAddon.id,
      startMinute: 540,
      endMinute: 660,
      hourlyRateCents: 200,
      currency: "PHP",
    }),
  ];

  const optionalUnselected = computeSchedulePriceDetailed({
    startTime,
    durationMinutes: 120,
    timeZone: "UTC",
    hoursWindows: makeHours(),
    rateRules: makeBaseRules(),
    addons: [{ addon: optionalAddon, rules: optionalAddonRules }],
    selectedAddonIds: [],
    enableAddonPricing: true,
  });

  assert.equal(optionalUnselected.result?.totalPriceCents, 2000);

  const autoHourlyAddon = makeAddon({
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    mode: "AUTO",
    pricingType: "HOURLY",
  });
  const autoHourlyRules = [
    makeRule({
      id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      addonId: autoHourlyAddon.id,
      startMinute: 540,
      endMinute: 600,
      hourlyRateCents: 300,
      currency: "PHP",
    }),
  ];

  const autoPartialCoverage = computeSchedulePriceDetailed({
    startTime,
    durationMinutes: 120,
    timeZone: "UTC",
    hoursWindows: makeHours(),
    rateRules: makeBaseRules(),
    addons: [{ addon: autoHourlyAddon, rules: autoHourlyRules }],
    enableAddonPricing: true,
  });

  assert.equal(autoPartialCoverage.result?.totalPriceCents, 2300);
  assert.equal(autoPartialCoverage.result?.warnings.length, 1);

  const flatAddon = makeAddon({
    id: "12121212-1212-1212-1212-121212121212",
    mode: "AUTO",
    pricingType: "FLAT",
    flatFeeCents: 500,
    flatFeeCurrency: "PHP",
  });
  const flatRules = [
    makeRule({
      id: "13131313-1313-1313-1313-131313131313",
      addonId: flatAddon.id,
      startMinute: 540,
      endMinute: 660,
    }),
  ];

  const flatChargedOnce = computeSchedulePriceDetailed({
    startTime,
    durationMinutes: 120,
    timeZone: "UTC",
    hoursWindows: makeHours(),
    rateRules: makeBaseRules(),
    addons: [{ addon: flatAddon, rules: flatRules }],
    enableAddonPricing: true,
  });

  assert.equal(flatChargedOnce.result?.totalPriceCents, 2500);

  const mismatchedAddon = makeAddon({
    id: "14141414-1414-1414-1414-141414141414",
    mode: "AUTO",
    pricingType: "HOURLY",
  });
  const mismatchedRules = [
    makeRule({
      id: "15151515-1515-1515-1515-151515151515",
      addonId: mismatchedAddon.id,
      startMinute: 540,
      endMinute: 660,
      hourlyRateCents: 100,
      currency: "USD",
    }),
  ];

  const mismatch = computeSchedulePriceDetailed({
    startTime,
    durationMinutes: 120,
    timeZone: "UTC",
    hoursWindows: makeHours(),
    rateRules: makeBaseRules(),
    addons: [{ addon: mismatchedAddon, rules: mismatchedRules }],
    enableAddonPricing: true,
  });

  assert.equal(mismatch.result, null);
  assert.equal(mismatch.failureReason, "ADDON_CURRENCY_MISMATCH");

  console.info("Addon pricing contract tests passed");
};

main();
