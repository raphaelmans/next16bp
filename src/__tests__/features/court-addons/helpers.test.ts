import { describe, expect, it } from "vitest";
import {
  type AddonRuleGroup,
  type CourtAddonConfig,
  collapseRulesToGroups,
  expandGroupsToRules,
  getAutoAddonIds,
  mapCourtAddonFormsToSetPayload,
  sanitizeSelectedAddonIds,
  sanitizeSelectedAddons,
} from "@/features/court-addons/helpers";
import type { CourtAddonRuleForm } from "@/features/court-addons/schemas";

// ── Shared rule builders ─────────────────────────────────────────────────────

function makeRule(
  overrides: Partial<CourtAddonRuleForm> = {},
): CourtAddonRuleForm {
  return {
    dayOfWeek: overrides.dayOfWeek ?? 1,
    startMinute: overrides.startMinute ?? 540,
    endMinute: overrides.endMinute ?? 1320,
    hourlyRateCents: overrides.hourlyRateCents,
    currency: overrides.currency,
  };
}

function makeGroup(overrides: Partial<AddonRuleGroup> = {}): AddonRuleGroup {
  return {
    days: overrides.days ?? [1],
    startMinute: overrides.startMinute ?? 540,
    endMinute: overrides.endMinute ?? 1320,
    hourlyRateCents: overrides.hourlyRateCents ?? null,
    currency: overrides.currency ?? null,
  };
}

// ── collapseRulesToGroups ────────────────────────────────────────────────────

describe("collapseRulesToGroups", () => {
  it.each([
    {
      name: "(a) 5 identical HOURLY weekday rows collapse to 1 group with 5 days",
      rules: [1, 2, 3, 4, 5].map((day) =>
        makeRule({ dayOfWeek: day, hourlyRateCents: 500, currency: "PHP" }),
      ),
      expectGroups: 1,
      expectFirstDays: [1, 2, 3, 4, 5],
      expectFirstRate: 500,
    },
    {
      name: "(b) FLAT Sa/Su rows collapse to 1 group with 2 days",
      rules: [5, 6].map((day) =>
        makeRule({
          dayOfWeek: day,
          hourlyRateCents: undefined,
          currency: undefined,
        }),
      ),
      expectGroups: 1,
      expectFirstDays: [5, 6],
      expectFirstRate: null,
    },
    {
      name: "(c) Mon ₱500 + Sat ₱800 same times → 2 separate groups",
      rules: [
        makeRule({ dayOfWeek: 1, hourlyRateCents: 500, currency: "PHP" }),
        makeRule({ dayOfWeek: 6, hourlyRateCents: 800, currency: "PHP" }),
      ],
      expectGroups: 2,
      expectFirstDays: [1],
      expectFirstRate: 500,
    },
    {
      name: "(d) single Mon row → 1 group with 1 day",
      rules: [
        makeRule({ dayOfWeek: 1, hourlyRateCents: 300, currency: "PHP" }),
      ],
      expectGroups: 1,
      expectFirstDays: [1],
      expectFirstRate: 300,
    },
  ])("$name", ({ rules, expectGroups, expectFirstDays, expectFirstRate }) => {
    const groups = collapseRulesToGroups(rules);

    expect(groups).toHaveLength(expectGroups);
    expect(groups[0]?.days).toEqual(expectFirstDays);
    expect(groups[0]?.hourlyRateCents).toBe(expectFirstRate);
  });

  it("empty input → empty output", () => {
    expect(collapseRulesToGroups([])).toEqual([]);
  });
});

// ── expandGroupsToRules ──────────────────────────────────────────────────────

describe("expandGroupsToRules", () => {
  it.each([
    {
      name: "(a) group with 3 days → 3 rows",
      group: makeGroup({
        days: [3, 4, 5],
        hourlyRateCents: 600,
        currency: "PHP",
      }),
      expectRows: 3,
      expectRate: 600,
    },
    {
      name: "(b) group with empty days → 0 rows (safe no-op)",
      group: makeGroup({ days: [] }),
      expectRows: 0,
      expectRate: null,
    },
    {
      name: "(c) FLAT group → rows with hourlyRateCents: undefined",
      group: makeGroup({ days: [5, 6], hourlyRateCents: null, currency: null }),
      expectRows: 2,
      expectRate: null,
    },
  ])("$name", ({ group, expectRows, expectRate }) => {
    const rules = expandGroupsToRules([group]);

    expect(rules).toHaveLength(expectRows);
    if (expectRows > 0) {
      expect(rules[0]?.hourlyRateCents).toBe(expectRate ?? undefined);
    }
  });

  it("each expanded row carries the correct day", () => {
    const group = makeGroup({ days: [3, 4, 5] });
    const rules = expandGroupsToRules([group]);

    expect(rules.map((r) => r.dayOfWeek)).toEqual([3, 4, 5]);
  });
});

// ── round-trip fidelity ──────────────────────────────────────────────────────

describe("expandGroupsToRules(collapseRulesToGroups(rows)) round-trip", () => {
  it("produces equivalent rows to the original set (sorted by dayOfWeek)", () => {
    const originalRules: CourtAddonRuleForm[] = [
      makeRule({ dayOfWeek: 1, hourlyRateCents: 500, currency: "PHP" }),
      makeRule({ dayOfWeek: 2, hourlyRateCents: 500, currency: "PHP" }),
      makeRule({ dayOfWeek: 3, hourlyRateCents: 500, currency: "PHP" }),
      makeRule({ dayOfWeek: 5, hourlyRateCents: 800, currency: "PHP" }),
      makeRule({ dayOfWeek: 6, hourlyRateCents: 800, currency: "PHP" }),
    ];

    const roundTripped = expandGroupsToRules(
      collapseRulesToGroups(originalRules),
    );

    const sort = (rows: CourtAddonRuleForm[]) =>
      [...rows].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    expect(sort(roundTripped)).toEqual(sort(originalRules));
  });

  it("FLAT rules round-trip correctly (null → undefined in CourtAddonRuleForm)", () => {
    const originalRules: CourtAddonRuleForm[] = [
      makeRule({
        dayOfWeek: 5,
        hourlyRateCents: undefined,
        currency: undefined,
      }),
      makeRule({
        dayOfWeek: 6,
        hourlyRateCents: undefined,
        currency: undefined,
      }),
    ];

    const roundTripped = expandGroupsToRules(
      collapseRulesToGroups(originalRules),
    );
    expect(roundTripped).toHaveLength(2);
    for (const rule of roundTripped) {
      expect(rule.hourlyRateCents).toBeUndefined();
      expect(rule.currency).toBeUndefined();
    }
  });
});

// ── existing helpers (retained) ──────────────────────────────────────────────

const makeAddonConfig = (
  overrides: Partial<CourtAddonConfig["addon"]>,
): CourtAddonConfig => ({
  addon: {
    id: overrides.id ?? "addon-1",
    label: overrides.label ?? "Ball rental",
    isActive: overrides.isActive ?? true,
    mode: overrides.mode ?? "OPTIONAL",
    pricingType: overrides.pricingType ?? "HOURLY",
    flatFeeCents: overrides.flatFeeCents ?? null,
    flatFeeCurrency: overrides.flatFeeCurrency ?? null,
    displayOrder: overrides.displayOrder ?? 0,
  },
  rules: [],
});

describe("court-addon helpers", () => {
  it("returns only active AUTO addon ids", () => {
    const configs: CourtAddonConfig[] = [
      makeAddonConfig({ id: "a1", mode: "AUTO", isActive: true }),
      makeAddonConfig({ id: "a2", mode: "OPTIONAL", isActive: true }),
      makeAddonConfig({ id: "a3", mode: "AUTO", isActive: false }),
    ];

    expect(getAutoAddonIds(configs)).toEqual(["a1"]);
  });

  it("sanitizes selected ids against active configured addons (legacy)", () => {
    const configs: CourtAddonConfig[] = [
      makeAddonConfig({ id: "a1", isActive: true }),
      makeAddonConfig({ id: "a2", isActive: false }),
      makeAddonConfig({ id: "a3", isActive: true }),
    ];

    expect(
      sanitizeSelectedAddonIds(["a1", "a2", "a1", "missing"], configs),
    ).toEqual(["a1"]);
  });

  it("sanitizeSelectedAddons filters inactive/unknown addons and deduplicates by addonId", () => {
    const configs: CourtAddonConfig[] = [
      makeAddonConfig({ id: "a1", isActive: true }),
      makeAddonConfig({ id: "a2", isActive: false }),
      makeAddonConfig({ id: "a3", isActive: true }),
    ];

    const result = sanitizeSelectedAddons(
      [
        { addonId: "a1", quantity: 2 },
        { addonId: "a2", quantity: 1 }, // inactive → removed
        { addonId: "a1", quantity: 3 }, // duplicate → last wins
        { addonId: "missing", quantity: 1 }, // unknown → removed
      ],
      configs,
    );

    expect(result).toEqual([{ addonId: "a1", quantity: 3 }]);
  });

  it("builds set payload respecting FLAT and HOURLY fields", () => {
    const payload = mapCourtAddonFormsToSetPayload("court_1", [
      {
        label: "Coach fee",
        isActive: true,
        mode: "OPTIONAL",
        pricingType: "FLAT",
        flatFeeCents: 500,
        flatFeeCurrency: "PHP",
        displayOrder: 0,
        rules: [
          {
            dayOfWeek: 1,
            startMinute: 480,
            endMinute: 600,
            hourlyRateCents: 200,
            currency: "PHP",
          },
        ],
      },
      {
        label: "Lighting",
        isActive: true,
        mode: "AUTO",
        pricingType: "HOURLY",
        flatFeeCents: 100,
        flatFeeCurrency: "PHP",
        displayOrder: 1,
        rules: [
          {
            dayOfWeek: 1,
            startMinute: 600,
            endMinute: 720,
            hourlyRateCents: 80,
            currency: "PHP",
          },
        ],
      },
    ]);

    expect(payload.courtId).toBe("court_1");
    expect(payload.addons[0]).toMatchObject({
      pricingType: "FLAT",
      flatFeeCents: 500,
      flatFeeCurrency: "PHP",
      rules: [
        {
          hourlyRateCents: undefined,
          currency: undefined,
        },
      ],
    });
    expect(payload.addons[1]).toMatchObject({
      pricingType: "HOURLY",
      flatFeeCents: undefined,
      flatFeeCurrency: undefined,
      rules: [
        {
          hourlyRateCents: 80,
          currency: "PHP",
        },
      ],
    });
  });
});
