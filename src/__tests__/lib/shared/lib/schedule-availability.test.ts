import { describe, expect, it } from "vitest";
import {
  computeSchedulePriceDetailed,
  type ScheduleAddon,
  type SchedulePricingWarning,
} from "@/lib/shared/lib/schedule-availability";
import { createSchedulePricingFixtures } from "./schedule-availability.fixtures";

describe("computeSchedulePriceDetailed", () => {
  it("OPTIONAL addon when not selected -> excludes add-on contribution", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(
      fixtures.golden.optionalUnselected,
    );

    // Assert
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2000);
  });

  it("AUTO addon with partial rule coverage -> warns and contributes +0 where uncovered", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(
      fixtures.golden.autoPartialCoverage,
    );

    // Assert
    const warning = output.result?.warnings[0] as
      | SchedulePricingWarning
      | undefined;
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2300);
    expect(output.result?.warnings).toHaveLength(1);
    expect(warning?.code).toBe("AUTO_ADDON_PARTIAL_COVERAGE");
  });

  it("HOURLY addon when fully covered -> accumulates by covered segments", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(
      fixtures.golden.hourlyAccumulation,
    );

    // Assert
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2600);
  });

  it("FLAT addon when overlapping multiple segments -> charges exactly once", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(fixtures.golden.flatChargeOnce);

    // Assert
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2500);
  });

  it("mismatched addon currency -> returns ADDON_CURRENCY_MISMATCH failure", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(
      fixtures.invalid.currencyMismatch,
    );

    // Assert
    expect(output.result).toBeNull();
    expect(output.failureReason).toBe("ADDON_CURRENCY_MISMATCH");
  });

  it("FLAT addon with zero rule windows -> still charges once per booking", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(fixtures.golden.flatNoWindows);

    // Assert — pricing succeeds and the flat fee is charged once
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2500);
  });

  it("two AUTO HOURLY addons covering same segment -> both rates accumulated independently", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(fixtures.golden.twoAutoHourly);

    // Assert — base 2000 + addon1 (200×2=400) + addon2 (150×2=300) = 2700
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2700);
  });

  it("HOURLY addon window wider than booking -> charges only covered booking segments", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act — booking is 09:00–11:00 (2 segments), addon window is 09:00–22:00
    const output = computeSchedulePriceDetailed(
      fixtures.golden.hourlyWiderWindow,
    );

    // Assert — base 2000 + addon (200×2=400) = 2400, not 200×13
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2400);
  });

  it("OPTIONAL HOURLY qty=1 selected -> same as binary selection (base 2000 + 200×1×2=400 = 2400)", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(fixtures.golden.quantityOne);

    // Assert
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2400);
  });

  it("OPTIONAL HOURLY qty=2 -> rate multiplied by quantity per segment (base 2000 + 200×2×2=800 = 2800)", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(fixtures.golden.quantityHourly);

    // Assert
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2800);
  });

  it("OPTIONAL FLAT qty=3 -> flat fee multiplied by quantity, charged once (base 2000 + 500×3=1500 = 3500)", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(fixtures.golden.quantityFlat);

    // Assert
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(3500);
  });

  it("venue and court OPTIONAL add-ons selected -> both scopes are priced", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();
    const venueAddon: ScheduleAddon = {
      addon: {
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        isActive: true,
        mode: "OPTIONAL",
        pricingType: "FLAT",
        flatFeeCents: 300,
        flatFeeCurrency: "PHP",
        label: "Venue paddle rental",
      },
      rules: [],
    };
    const courtAddon = fixtures.golden.quantityOne.addons[0];
    if (!courtAddon) {
      throw new Error("Missing court addon fixture");
    }

    // Act
    const output = computeSchedulePriceDetailed({
      ...fixtures.minimal.baseOnly,
      addons: [courtAddon],
      venueAddons: [venueAddon],
      selectedAddons: [
        { addonId: venueAddon.addon.id, quantity: 2 },
        { addonId: courtAddon.addon.id, quantity: 1 },
      ],
    });

    // Assert — base 2000 + court HOURLY (200×2=400) + venue FLAT (300×2=600)
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(3000);
  });

  it("minimal fixture without addons -> returns base total", () => {
    // Arrange
    const fixtures = createSchedulePricingFixtures();

    // Act
    const output = computeSchedulePriceDetailed(fixtures.minimal.baseOnly);

    // Assert
    expect(output.failureReason).toBeNull();
    expect(output.result?.totalPriceCents).toBe(2000);
  });
});
