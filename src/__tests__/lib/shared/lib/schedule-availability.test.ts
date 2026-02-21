import { describe, expect, it } from "vitest";
import {
  computeSchedulePriceDetailed,
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
