import { describe, expect, it } from "vitest";
import {
  type CourtAddonConfig,
  getAutoAddonIds,
  mapCourtAddonFormsToSetPayload,
  sanitizeSelectedAddonIds,
} from "@/features/court-addons";

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

  it("sanitizes selected ids against active configured addons", () => {
    const configs: CourtAddonConfig[] = [
      makeAddonConfig({ id: "a1", isActive: true }),
      makeAddonConfig({ id: "a2", isActive: false }),
      makeAddonConfig({ id: "a3", isActive: true }),
    ];

    expect(
      sanitizeSelectedAddonIds(["a1", "a2", "a1", "missing"], configs),
    ).toEqual(["a1"]);
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
