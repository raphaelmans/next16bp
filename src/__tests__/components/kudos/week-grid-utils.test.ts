import { describe, expect, it } from "vitest";
import type { TimeSlot } from "@/components/kudos/time-slot-picker";
import {
  getHourFromSlot,
  isSameInstant,
  isSlotAvailable,
  isSlotSelectable,
  MAX_DURATION_MINUTES,
  MAX_SLOT_COUNT,
  TIMELINE_SLOT_DURATION,
} from "@/components/kudos/week-grid-utils";

const TZ = "Asia/Manila";

const makeSlot = (
  startTimeUtc: string,
  endTimeUtc: string,
  status: "available" | "booked",
): TimeSlot => ({
  id: `court-1-${startTimeUtc}-60`,
  startTime: startTimeUtc,
  endTime: endTimeUtc,
  priceCents: 50000,
  currency: "PHP",
  status,
});

describe("week-grid-utils constants", () => {
  it("TIMELINE_SLOT_DURATION is 60 minutes", () => {
    expect(TIMELINE_SLOT_DURATION).toBe(60);
  });

  it("MAX_DURATION_MINUTES is 1440 (24 hours)", () => {
    expect(MAX_DURATION_MINUTES).toBe(1440);
  });

  it("MAX_SLOT_COUNT is 24 (1440 / 60)", () => {
    expect(MAX_SLOT_COUNT).toBe(24);
  });
});

describe("isSameInstant", () => {
  it("returns true for identical ISO strings", () => {
    expect(
      isSameInstant("2026-03-05T14:00:00.000Z", "2026-03-05T14:00:00.000Z"),
    ).toBe(true);
  });

  it("returns false for different instants", () => {
    expect(
      isSameInstant("2026-03-05T14:00:00.000Z", "2026-03-05T15:00:00.000Z"),
    ).toBe(false);
  });
});

describe("getHourFromSlot", () => {
  it("extracts local hour from UTC slot", () => {
    const slot = makeSlot(
      "2026-03-05T14:00:00.000Z",
      "2026-03-05T15:00:00.000Z",
      "available",
    );
    // 14:00 UTC = 22:00 PHT
    expect(getHourFromSlot(slot, TZ)).toBe(22);
  });

  it("handles midnight crossover", () => {
    const slot = makeSlot(
      "2026-03-05T16:00:00.000Z",
      "2026-03-05T17:00:00.000Z",
      "available",
    );
    // 16:00 UTC = 00:00 PHT (next day)
    expect(getHourFromSlot(slot, TZ)).toBe(0);
  });
});

describe("isSlotAvailable", () => {
  it("returns true for available slot", () => {
    expect(
      isSlotAvailable(
        makeSlot(
          "2026-03-05T14:00:00.000Z",
          "2026-03-05T15:00:00.000Z",
          "available",
        ),
      ),
    ).toBe(true);
  });

  it("returns false for booked slot", () => {
    expect(
      isSlotAvailable(
        makeSlot(
          "2026-03-05T14:00:00.000Z",
          "2026-03-05T15:00:00.000Z",
          "booked",
        ),
      ),
    ).toBe(false);
  });
});

describe("isSlotSelectable", () => {
  const pastNowMs = Date.parse("2026-03-01T00:00:00.000Z");
  const futureNowMs = Date.parse("2026-03-10T00:00:00.000Z");

  it("returns true for available future slot", () => {
    expect(
      isSlotSelectable(
        makeSlot(
          "2026-03-05T14:00:00.000Z",
          "2026-03-05T15:00:00.000Z",
          "available",
        ),
        pastNowMs,
      ),
    ).toBe(true);
  });

  it("returns false for available past slot", () => {
    expect(
      isSlotSelectable(
        makeSlot(
          "2026-03-05T14:00:00.000Z",
          "2026-03-05T15:00:00.000Z",
          "available",
        ),
        futureNowMs,
      ),
    ).toBe(false);
  });

  it("returns false for booked future slot", () => {
    expect(
      isSlotSelectable(
        makeSlot(
          "2026-03-05T14:00:00.000Z",
          "2026-03-05T15:00:00.000Z",
          "booked",
        ),
        pastNowMs,
      ),
    ).toBe(false);
  });
});
