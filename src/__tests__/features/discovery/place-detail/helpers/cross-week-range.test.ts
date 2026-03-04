import { describe, expect, it } from "vitest";
import type { TimeSlot } from "@/components/kudos";
import { resolveCourtRangeAcrossWeekBoundary } from "@/features/discovery/place-detail/helpers/cross-week-range";

const TIME_ZONE = "Asia/Manila";

function makeSlot(
  iso: string,
  status: TimeSlot["status"] = "available",
): TimeSlot {
  const end = new Date(Date.parse(iso) + 60 * 60 * 1000).toISOString();
  return {
    id: iso,
    startTime: iso,
    endTime: end,
    status,
    currency: "PHP",
    priceCents: 50000,
  };
}

describe("resolveCourtRangeAcrossWeekBoundary", () => {
  it("merges from preserved start outside visible week when slots are contiguous", () => {
    const slotsByDay = new Map<string, TimeSlot[]>([
      [
        "2026-03-14",
        [
          makeSlot("2026-03-14T14:00:00.000Z"), // 10 PM PHT
          makeSlot("2026-03-14T15:00:00.000Z"), // 11 PM PHT
        ],
      ],
      [
        "2026-03-15",
        [
          makeSlot("2026-03-14T16:00:00.000Z"), // 12 AM PHT
          makeSlot("2026-03-14T17:00:00.000Z"), // 1 AM PHT
        ],
      ],
    ]);

    const result = resolveCourtRangeAcrossWeekBoundary({
      selectedStartTime: "2026-03-14T14:00:00.000Z",
      incomingRange: {
        startTime: "2026-03-14T17:00:00.000Z",
        durationMinutes: 60,
      },
      visibleWeekDayKeys: [
        "2026-03-15",
        "2026-03-16",
        "2026-03-17",
        "2026-03-18",
        "2026-03-19",
        "2026-03-20",
        "2026-03-21",
      ],
      slotsByDay,
      timeZone: TIME_ZONE,
      nowMs: Date.parse("2026-03-01T00:00:00.000Z"),
    });

    expect(result).toEqual({
      startTime: "2026-03-14T14:00:00.000Z",
      durationMinutes: 240,
    });
  });

  it("does not merge when preserved start is already within visible week", () => {
    const incomingRange = {
      startTime: "2026-03-14T17:00:00.000Z",
      durationMinutes: 60,
    };

    const result = resolveCourtRangeAcrossWeekBoundary({
      selectedStartTime: "2026-03-14T14:00:00.000Z",
      incomingRange,
      visibleWeekDayKeys: [
        "2026-03-14",
        "2026-03-15",
        "2026-03-16",
        "2026-03-17",
        "2026-03-18",
        "2026-03-19",
        "2026-03-20",
      ],
      slotsByDay: new Map(),
      timeZone: TIME_ZONE,
      nowMs: Date.parse("2026-03-01T00:00:00.000Z"),
    });

    expect(result).toEqual(incomingRange);
  });

  it("does not merge when a contiguous slot is missing", () => {
    const slotsByDay = new Map<string, TimeSlot[]>([
      [
        "2026-03-14",
        [
          makeSlot("2026-03-14T14:00:00.000Z"),
          makeSlot("2026-03-14T15:00:00.000Z"),
        ],
      ],
      [
        "2026-03-15",
        [
          // missing 12 AM (2026-03-14T16:00:00.000Z)
          makeSlot("2026-03-14T17:00:00.000Z"),
        ],
      ],
    ]);

    const incomingRange = {
      startTime: "2026-03-14T17:00:00.000Z",
      durationMinutes: 60,
    };

    const result = resolveCourtRangeAcrossWeekBoundary({
      selectedStartTime: "2026-03-14T14:00:00.000Z",
      incomingRange,
      visibleWeekDayKeys: [
        "2026-03-15",
        "2026-03-16",
        "2026-03-17",
        "2026-03-18",
        "2026-03-19",
        "2026-03-20",
        "2026-03-21",
      ],
      slotsByDay,
      timeZone: TIME_ZONE,
      nowMs: Date.parse("2026-03-01T00:00:00.000Z"),
    });

    expect(result).toEqual(incomingRange);
  });

  it("does not merge when a contiguous slot is unavailable", () => {
    const slotsByDay = new Map<string, TimeSlot[]>([
      [
        "2026-03-14",
        [
          makeSlot("2026-03-14T14:00:00.000Z"),
          makeSlot("2026-03-14T15:00:00.000Z", "booked"),
        ],
      ],
      [
        "2026-03-15",
        [
          makeSlot("2026-03-14T16:00:00.000Z"),
          makeSlot("2026-03-14T17:00:00.000Z"),
        ],
      ],
    ]);

    const incomingRange = {
      startTime: "2026-03-14T17:00:00.000Z",
      durationMinutes: 60,
    };

    const result = resolveCourtRangeAcrossWeekBoundary({
      selectedStartTime: "2026-03-14T14:00:00.000Z",
      incomingRange,
      visibleWeekDayKeys: [
        "2026-03-15",
        "2026-03-16",
        "2026-03-17",
        "2026-03-18",
        "2026-03-19",
        "2026-03-20",
        "2026-03-21",
      ],
      slotsByDay,
      timeZone: TIME_ZONE,
      nowMs: Date.parse("2026-03-01T00:00:00.000Z"),
    });

    expect(result).toEqual(incomingRange);
  });
});
