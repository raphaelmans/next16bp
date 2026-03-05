import { describe, expect, it } from "vitest";
import {
  buildTimelineBlocksForDay,
  buildTimelineReservationsForDay,
  getBlockCtaLabel,
} from "@/features/owner/booking-studio/helpers";
import { TIMELINE_ROW_HEIGHT } from "@/features/owner/components/booking-studio/types";

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

const TZ = "UTC";

const makeBlock = (
  startTime: string,
  endTime: string,
): Parameters<typeof buildTimelineBlocksForDay>[0]["blocks"][number] => ({
  id: "b1",
  courtId: "c1",
  type: "MAINTENANCE",
  startTime,
  endTime,
  reason: null,
  totalPriceCents: 0,
  currency: "USD",
  isActive: true,
  cancelledAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

const makeReservation = (
  startTime: string,
  endTime: string,
): Parameters<
  typeof buildTimelineReservationsForDay
>[0]["reservations"][number] => ({
  id: "r1",
  courtId: "c1",
  startTime,
  endTime,
  status: "CONFIRMED",
  totalPriceCents: 0,
  currency: "USD",
  playerNameSnapshot: "Player",
  guestProfileId: null,
  playerId: null,
  groupId: null,
});

// ---------------------------------------------------------------------------
// buildTimelineBlocksForDay — midnight boundary
// ---------------------------------------------------------------------------

describe("buildTimelineBlocksForDay", () => {
  describe("midnight boundary on a 24-hour grid", () => {
    const hours24 = Array.from({ length: 24 }, (_, i) => i);

    it("renders Thu 11 PM–midnight segment on a 24-hour grid", () => {
      const result = buildTimelineBlocksForDay({
        blocks: [makeBlock("2026-03-05T23:00:00Z", "2026-03-06T02:00:00Z")],
        dayKey: "2026-03-05",
        dayStart: new Date("2026-03-05T00:00:00Z"),
        timeZone: TZ,
        hours: hours24,
      });

      expect(result).toHaveLength(1);
      expect(result[0].topOffset).toBe(23 * TIMELINE_ROW_HEIGHT);
      expect(result[0].height).toBe(1 * TIMELINE_ROW_HEIGHT);
    });

    it("renders Fri midnight–2 AM segment on a 24-hour grid", () => {
      const result = buildTimelineBlocksForDay({
        blocks: [makeBlock("2026-03-05T23:00:00Z", "2026-03-06T02:00:00Z")],
        dayKey: "2026-03-06",
        dayStart: new Date("2026-03-06T00:00:00Z"),
        timeZone: TZ,
        hours: hours24,
      });

      expect(result).toHaveLength(1);
      expect(result[0].topOffset).toBe(0);
      expect(result[0].height).toBe(2 * TIMELINE_ROW_HEIGHT);
    });
  });

  describe("midnight boundary on an overnight grid", () => {
    // Schedule: 6 AM–2 AM → [6,7,...,23,0,1]
    const hoursOvernight = [
      6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1,
    ];

    it("renders 11 PM–midnight as 1 row ending at hour-0 position", () => {
      const result = buildTimelineBlocksForDay({
        blocks: [makeBlock("2026-03-05T23:00:00Z", "2026-03-06T02:00:00Z")],
        dayKey: "2026-03-05",
        dayStart: new Date("2026-03-05T00:00:00Z"),
        timeZone: TZ,
        hours: hoursOvernight,
      });

      expect(result).toHaveLength(1);
      // hour 23 is at index 17, hour 0 is at index 18
      expect(result[0].topOffset).toBe(17 * TIMELINE_ROW_HEIGHT);
      expect(result[0].height).toBe(1 * TIMELINE_ROW_HEIGHT);
    });
  });

  describe("block fully within a single day", () => {
    it("renders a daytime block on a standard grid", () => {
      const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

      const result = buildTimelineBlocksForDay({
        blocks: [makeBlock("2026-03-05T10:00:00Z", "2026-03-05T12:00:00Z")],
        dayKey: "2026-03-05",
        dayStart: new Date("2026-03-05T00:00:00Z"),
        timeZone: TZ,
        hours,
      });

      expect(result).toHaveLength(1);
      // hour 10 is at index 2
      expect(result[0].topOffset).toBe(2 * TIMELINE_ROW_HEIGHT);
      expect(result[0].height).toBe(2 * TIMELINE_ROW_HEIGHT);
    });
  });
});

// ---------------------------------------------------------------------------
// buildTimelineReservationsForDay — same midnight boundary
// ---------------------------------------------------------------------------

describe("buildTimelineReservationsForDay", () => {
  const hours24 = Array.from({ length: 24 }, (_, i) => i);

  it("renders overnight reservation's first-day segment on 24h grid", () => {
    const result = buildTimelineReservationsForDay({
      reservations: [
        makeReservation("2026-03-05T23:00:00Z", "2026-03-06T02:00:00Z"),
      ],
      dayKey: "2026-03-05",
      dayStart: new Date("2026-03-05T00:00:00Z"),
      timeZone: TZ,
      hours: hours24,
    });

    expect(result).toHaveLength(1);
    expect(result[0].topOffset).toBe(23 * TIMELINE_ROW_HEIGHT);
    expect(result[0].height).toBe(1 * TIMELINE_ROW_HEIGHT);
  });

  it("renders overnight reservation's second-day segment on 24h grid", () => {
    const result = buildTimelineReservationsForDay({
      reservations: [
        makeReservation("2026-03-05T23:00:00Z", "2026-03-06T02:00:00Z"),
      ],
      dayKey: "2026-03-06",
      dayStart: new Date("2026-03-06T00:00:00Z"),
      timeZone: TZ,
      hours: hours24,
    });

    expect(result).toHaveLength(1);
    expect(result[0].topOffset).toBe(0);
    expect(result[0].height).toBe(2 * TIMELINE_ROW_HEIGHT);
  });

  it("excludes reservation outside the day range", () => {
    const result = buildTimelineReservationsForDay({
      reservations: [
        makeReservation("2026-03-06T10:00:00Z", "2026-03-06T12:00:00Z"),
      ],
      dayKey: "2026-03-05",
      dayStart: new Date("2026-03-05T00:00:00Z"),
      timeZone: TZ,
      hours: hours24,
    });

    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getBlockCtaLabel
// ---------------------------------------------------------------------------

describe("getBlockCtaLabel", () => {
  it.each<{
    blockType: "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING";
    expected: string;
  }>([
    { blockType: "WALK_IN", expected: "Save walk-in" },
    { blockType: "MAINTENANCE", expected: "Save block" },
    { blockType: "GUEST_BOOKING", expected: "Save booking" },
  ])("returns '$expected' for $blockType", ({ blockType, expected }) => {
    expect(getBlockCtaLabel(blockType)).toBe(expected);
  });
});
