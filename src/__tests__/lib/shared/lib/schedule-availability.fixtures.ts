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
  selectedAddons?: { addonId: string; quantity: number }[];
  enableAddonPricing: boolean;
};

export type SchedulePricingFixtureSet = {
  golden: {
    optionalUnselected: SchedulePricingFixtureInput;
    autoPartialCoverage: SchedulePricingFixtureInput;
    hourlyAccumulation: SchedulePricingFixtureInput;
    flatChargeOnce: SchedulePricingFixtureInput;
    flatNoWindows: SchedulePricingFixtureInput;
    twoAutoHourly: SchedulePricingFixtureInput;
    hourlyWiderWindow: SchedulePricingFixtureInput;
    quantityOne: SchedulePricingFixtureInput;
    quantityHourly: SchedulePricingFixtureInput;
    quantityFlat: SchedulePricingFixtureInput;
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

  // 3.1 – FLAT addon with zero rule windows
  const flatNoWindowsAddon = createAddon({
    id: "20202020-2020-2020-2020-202020202020",
    mode: "AUTO",
    pricingType: "FLAT",
    flatFeeCents: 500,
    flatFeeCurrency: "PHP",
  });
  // intentionally no rules → zero windows

  // 3.2 – Two AUTO HOURLY addons on the same segment
  const twoAutoAddon1 = createAddon({
    id: "30303030-3030-3030-3030-303030303030",
    mode: "AUTO",
    pricingType: "HOURLY",
  });
  const twoAutoAddon1Rules = [
    createAddonRule({
      id: "31313131-3131-3131-3131-313131313131",
      addonId: twoAutoAddon1.id,
      startMinute: 540,
      endMinute: 660,
      hourlyRateCents: 200,
      currency: "PHP",
    }),
  ];
  const twoAutoAddon2 = createAddon({
    id: "40404040-4040-4040-4040-404040404040",
    mode: "AUTO",
    pricingType: "HOURLY",
  });
  const twoAutoAddon2Rules = [
    createAddonRule({
      id: "41414141-4141-4141-4141-414141414141",
      addonId: twoAutoAddon2.id,
      startMinute: 540,
      endMinute: 660,
      hourlyRateCents: 150,
      currency: "PHP",
    }),
  ];

  // 3.3 – HOURLY addon window wider than booking (09:00–22:00, booking 09:00–11:00)
  const widerWindowAddon = createAddon({
    id: "50505050-5050-5050-5050-505050505050",
    mode: "AUTO",
    pricingType: "HOURLY",
  });
  const widerWindowRules = [
    createAddonRule({
      id: "51515151-5151-5151-5151-515151515151",
      addonId: widerWindowAddon.id,
      startMinute: 540, // 09:00
      endMinute: 1320, // 22:00
      hourlyRateCents: 200,
      currency: "PHP",
    }),
  ];

  // quantity test addons
  // Re-uses optionalAddon (OPTIONAL HOURLY, rate=200) for qty=1 and qty=2
  const optionalFlatAddon = createAddon({
    id: "60606060-6060-6060-6060-606060606060",
    mode: "OPTIONAL",
    pricingType: "FLAT",
    flatFeeCents: 500,
    flatFeeCurrency: "PHP",
  });
  const optionalFlatRules = [
    createAddonRule({
      id: "61616161-6161-6161-6161-616161616161",
      addonId: optionalFlatAddon.id,
      startMinute: 540,
      endMinute: 660,
    }),
  ];

  const buildBaseFixture = (): Omit<
    SchedulePricingFixtureInput,
    "addons" | "selectedAddons"
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
        selectedAddons: [],
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
      flatNoWindows: {
        ...buildBaseFixture(),
        addons: [{ addon: flatNoWindowsAddon, rules: [] }],
      },
      twoAutoHourly: {
        ...buildBaseFixture(),
        addons: [
          { addon: twoAutoAddon1, rules: twoAutoAddon1Rules },
          { addon: twoAutoAddon2, rules: twoAutoAddon2Rules },
        ],
      },
      hourlyWiderWindow: {
        ...buildBaseFixture(),
        addons: [{ addon: widerWindowAddon, rules: widerWindowRules }],
      },
      // qty=1 explicit → same result as legacy binary selection
      quantityOne: {
        ...buildBaseFixture(),
        addons: [{ addon: optionalAddon, rules: optionalAddonRules }],
        selectedAddons: [{ addonId: optionalAddon.id, quantity: 1 }],
      },
      // qty=2 HOURLY → rate×2×segments
      quantityHourly: {
        ...buildBaseFixture(),
        addons: [{ addon: optionalAddon, rules: optionalAddonRules }],
        selectedAddons: [{ addonId: optionalAddon.id, quantity: 2 }],
      },
      // qty=3 FLAT → flatFee×3 (charged once, multiplied)
      quantityFlat: {
        ...buildBaseFixture(),
        addons: [{ addon: optionalFlatAddon, rules: optionalFlatRules }],
        selectedAddons: [{ addonId: optionalFlatAddon.id, quantity: 3 }],
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
