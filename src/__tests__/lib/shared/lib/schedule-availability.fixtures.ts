import type {
  CourtAddonRateRuleRecord,
  CourtAddonRecord,
  CourtHoursWindowRecord,
  CourtRateRuleRecord,
} from "@/lib/shared/infra/db/schema";
import type { ScheduleAddon } from "@/lib/shared/lib/schedule-availability";

const now = new Date("2026-01-05T00:00:00.000Z");
const courtId = "11111111-1111-1111-1111-111111111111";
const startTime = new Date("2026-01-05T09:00:00.000Z");

export type SchedulePricingFixtureInput = {
  startTime: Date;
  durationMinutes: number;
  timeZone: string;
  hoursWindows: CourtHoursWindowRecord[];
  rateRules: CourtRateRuleRecord[];
  addons: ScheduleAddon[];
  selectedAddonIds?: string[];
  enableAddonPricing: boolean;
};

export type SchedulePricingFixtureSet = {
  golden: {
    optionalUnselected: SchedulePricingFixtureInput;
    autoPartialCoverage: SchedulePricingFixtureInput;
    hourlyAccumulation: SchedulePricingFixtureInput;
    flatChargeOnce: SchedulePricingFixtureInput;
  };
  minimal: {
    baseOnly: SchedulePricingFixtureInput;
  };
  invalid: {
    currencyMismatch: SchedulePricingFixtureInput;
  };
};

const createHoursWindows = (): CourtHoursWindowRecord[] => [
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

const createRateRules = (): CourtRateRuleRecord[] => [
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

const createAddon = (input: {
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

const createAddonRule = (input: {
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

export const createSchedulePricingFixtures = (): SchedulePricingFixtureSet => {
  const optionalAddon = createAddon({
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    mode: "OPTIONAL",
    pricingType: "HOURLY",
  });
  const optionalAddonRules = [
    createAddonRule({
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      addonId: optionalAddon.id,
      startMinute: 540,
      endMinute: 660,
      hourlyRateCents: 200,
      currency: "PHP",
    }),
  ];

  const autoPartialAddon = createAddon({
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    mode: "AUTO",
    pricingType: "HOURLY",
  });
  const autoPartialRules = [
    createAddonRule({
      id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      addonId: autoPartialAddon.id,
      startMinute: 540,
      endMinute: 600,
      hourlyRateCents: 300,
      currency: "PHP",
    }),
  ];

  const autoAccumulationAddon = createAddon({
    id: "01010101-0101-0101-0101-010101010101",
    mode: "AUTO",
    pricingType: "HOURLY",
  });
  const autoAccumulationRules = [
    createAddonRule({
      id: "02020202-0202-0202-0202-020202020202",
      addonId: autoAccumulationAddon.id,
      startMinute: 540,
      endMinute: 660,
      hourlyRateCents: 300,
      currency: "PHP",
    }),
  ];

  const flatAddon = createAddon({
    id: "12121212-1212-1212-1212-121212121212",
    mode: "AUTO",
    pricingType: "FLAT",
    flatFeeCents: 500,
    flatFeeCurrency: "PHP",
  });
  const flatRules = [
    createAddonRule({
      id: "13131313-1313-1313-1313-131313131313",
      addonId: flatAddon.id,
      startMinute: 540,
      endMinute: 660,
    }),
  ];

  const mismatchAddon = createAddon({
    id: "14141414-1414-1414-1414-141414141414",
    mode: "AUTO",
    pricingType: "HOURLY",
  });
  const mismatchRules = [
    createAddonRule({
      id: "15151515-1515-1515-1515-151515151515",
      addonId: mismatchAddon.id,
      startMinute: 540,
      endMinute: 660,
      hourlyRateCents: 100,
      currency: "USD",
    }),
  ];

  const buildBaseFixture = (): Omit<
    SchedulePricingFixtureInput,
    "addons" | "selectedAddonIds"
  > => ({
    startTime,
    durationMinutes: 120,
    timeZone: "UTC",
    hoursWindows: createHoursWindows(),
    rateRules: createRateRules(),
    enableAddonPricing: true,
  });

  return {
    golden: {
      optionalUnselected: {
        ...buildBaseFixture(),
        addons: [{ addon: optionalAddon, rules: optionalAddonRules }],
        selectedAddonIds: [],
      },
      autoPartialCoverage: {
        ...buildBaseFixture(),
        addons: [{ addon: autoPartialAddon, rules: autoPartialRules }],
      },
      hourlyAccumulation: {
        ...buildBaseFixture(),
        addons: [
          { addon: autoAccumulationAddon, rules: autoAccumulationRules },
        ],
      },
      flatChargeOnce: {
        ...buildBaseFixture(),
        addons: [{ addon: flatAddon, rules: flatRules }],
      },
    },
    minimal: {
      baseOnly: {
        ...buildBaseFixture(),
        addons: [],
      },
    },
    invalid: {
      currencyMismatch: {
        ...buildBaseFixture(),
        addons: [{ addon: mismatchAddon, rules: mismatchRules }],
      },
    },
  };
};
