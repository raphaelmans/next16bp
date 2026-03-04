import { describe, expect, it } from "vitest";
import {
  getNextDayKeyForInstant,
  isSameOrNextDay,
  isWithinAdjacentWeek,
} from "@/features/discovery/place-detail/helpers/date-adjacency";

describe("date-adjacency helpers", () => {
  const timeZone = "Asia/Manila";

  it("computes the next day key for a late-night start", () => {
    // 2026-03-06 22:00 PHT
    const startTime = "2026-03-06T14:00:00.000Z";
    expect(getNextDayKeyForInstant(startTime, timeZone)).toBe("2026-03-07");
  });

  it("returns true for same day candidate", () => {
    const startTime = "2026-03-06T14:00:00.000Z";
    expect(
      isSameOrNextDay({
        selectedStartTimeIso: startTime,
        candidateDayKey: "2026-03-06",
        timeZone,
      }),
    ).toBe(true);
  });

  it("returns true for adjacent next day candidate", () => {
    const startTime = "2026-03-06T14:00:00.000Z";
    expect(
      isSameOrNextDay({
        selectedStartTimeIso: startTime,
        candidateDayKey: "2026-03-07",
        timeZone,
      }),
    ).toBe(true);
  });

  it("returns false for non-adjacent day candidate", () => {
    const startTime = "2026-03-06T14:00:00.000Z";
    expect(
      isSameOrNextDay({
        selectedStartTimeIso: startTime,
        candidateDayKey: "2026-03-08",
        timeZone,
      }),
    ).toBe(false);
  });

  it("returns true when candidate is within adjacent week window", () => {
    const startTime = "2026-03-06T14:00:00.000Z";
    expect(
      isWithinAdjacentWeek({
        selectedStartTimeIso: startTime,
        candidateDayKey: "2026-03-13",
        timeZone,
      }),
    ).toBe(true);
  });

  it("returns false when candidate is beyond adjacent week window", () => {
    const startTime = "2026-03-06T14:00:00.000Z";
    expect(
      isWithinAdjacentWeek({
        selectedStartTimeIso: startTime,
        candidateDayKey: "2026-03-14",
        timeZone,
      }),
    ).toBe(false);
  });
});
