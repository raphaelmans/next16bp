import { describe, expect, it, vi } from "vitest";
import {
  buildOwnerBlockedCellSet,
  buildOwnerSelectionConfig,
  dayToLinearIndex,
  linearToDayIndex,
} from "@/features/owner/components/booking-studio/owner-week-grid-domain";
import { TIMELINE_ROW_HEIGHT } from "@/features/owner/components/booking-studio/types";

// ---------------------------------------------------------------------------
// linearToDayIndex / dayToLinearIndex
// ---------------------------------------------------------------------------

describe("linearToDayIndex", () => {
  it("returns dayColIdx=0, hourIdx=0 for index 0", () => {
    expect(linearToDayIndex(0, 24)).toEqual({ dayColIdx: 0, hourIdx: 0 });
  });

  it("returns correct split for mid-day index", () => {
    expect(linearToDayIndex(27, 24)).toEqual({ dayColIdx: 1, hourIdx: 3 });
  });

  it("round-trips with dayToLinearIndex", () => {
    const linear = dayToLinearIndex(3, 17, 24);
    expect(linearToDayIndex(linear, 24)).toEqual({ dayColIdx: 3, hourIdx: 17 });
  });
});

describe("dayToLinearIndex", () => {
  it("returns 0 for (0, 0, 24)", () => {
    expect(dayToLinearIndex(0, 0, 24)).toBe(0);
  });

  it("returns correct linear index for day 5 hour 10", () => {
    expect(dayToLinearIndex(5, 10, 24)).toBe(5 * 24 + 10);
  });
});

// ---------------------------------------------------------------------------
// buildOwnerBlockedCellSet
// ---------------------------------------------------------------------------

describe("buildOwnerBlockedCellSet", () => {
  it("returns empty set for no overlays", () => {
    const result = buildOwnerBlockedCellSet([], TIMELINE_ROW_HEIGHT);
    expect(result.size).toBe(0);
  });

  it("blocks cells covered by an overlay", () => {
    const overlays = [
      { topOffset: 2 * TIMELINE_ROW_HEIGHT, height: 3 * TIMELINE_ROW_HEIGHT },
    ];
    const result = buildOwnerBlockedCellSet(overlays, TIMELINE_ROW_HEIGHT);
    expect(result).toEqual(new Set([2, 3, 4]));
  });
});

// ---------------------------------------------------------------------------
// buildOwnerSelectionConfig — cross-midnight selection
// ---------------------------------------------------------------------------

describe("buildOwnerSelectionConfig", () => {
  const weekDayKeys = [
    "2026-03-02",
    "2026-03-03",
    "2026-03-04",
    "2026-03-05",
    "2026-03-06",
    "2026-03-07",
    "2026-03-08",
  ];
  // Overnight grid: 6 AM–2 AM → [6,7,...,23,0,1]
  const hours = [
    6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1,
  ];
  const hoursPerDay = hours.length;

  function makeConfig(
    overrides?: Partial<Parameters<typeof buildOwnerSelectionConfig>[0]>,
  ) {
    const onCommitRange = vi.fn();
    const config = buildOwnerSelectionConfig({
      weekDayKeys,
      hours,
      timeZone: "UTC",
      blocksByDay: new Map(),
      reservationsByDay: new Map(),
      courtHoursWindows: [],
      compact: false,
      onCommitRange,
      ...overrides,
    });
    return { config, onCommitRange };
  }

  describe("same-day selection", () => {
    it("allows selection within a single day", () => {
      const { config } = makeConfig();
      // Saturday (dayColIdx=5), hours 10–12 (hourIdx 4,5,6)
      const anchor = dayToLinearIndex(5, 4, hoursPerDay);
      const target = dayToLinearIndex(5, 6, hoursPerDay);
      const range = config.computeRange(anchor, target);
      expect(range).toEqual({ startIdx: anchor, endIdx: target });
    });
  });

  describe("cross-midnight (adjacent-day) selection", () => {
    it("allows selection from Saturday evening to Sunday morning", () => {
      const { config } = makeConfig();
      // Saturday hour 23 (hourIdx=17) → Sunday hour 1 (hourIdx=19 would be same day, but Sunday hour 0 is dayColIdx=6, hourIdx=18)
      // Saturday dayColIdx=5, hour 23 = hourIdx 17
      // Sunday dayColIdx=6, hour 0 = hourIdx 18, hour 1 = hourIdx 19
      // Wait — hours are [6..23,0,1]. hour 0 is at index 18. For Sunday (dayColIdx=6), hour 0 is at linearIdx = 6*20+18 = 138.
      // But Saturday hour 23 is at hourIdx 17, linearIdx = 5*20+17 = 117.
      // These are NOT adjacent — they're on different columns and the gap is 138-117 = 21 cells.

      // For cross-midnight on the same COLUMN, hours wrap: Sat col has [6..23,0,1] where 0=midnight and 1=1AM are still Saturday's column.
      // So a Sat 11PM → Sun 1AM range in the overnight grid would be:
      // Sat hour 23 = hourIdx 17, Sat hour 0 = hourIdx 18, Sat hour 1 = hourIdx 19 — ALL within Saturday's column.

      // The actual cross-day scenario is when user drags from Saturday's last slot (hourIdx 19, hour 1) into Sunday's first slot (hourIdx 0, hour 6).
      const satLastSlot = dayToLinearIndex(5, hoursPerDay - 1, hoursPerDay); // Sat hour 1 (index 19)
      const sunFirstSlot = dayToLinearIndex(6, 0, hoursPerDay); // Sun hour 6 (index 0 in Sun)
      const range = config.computeRange(satLastSlot, sunFirstSlot);
      expect(range).toEqual({
        startIdx: satLastSlot,
        endIdx: sunFirstSlot,
      });
    });

    it("allows Sat evening into early Sun on an adjacent-day span", () => {
      const { config } = makeConfig();
      // Sat hourIdx 15 (hour 21 = 9 PM) → Sun hourIdx 2 (hour 8 = 8 AM)
      const anchor = dayToLinearIndex(5, 15, hoursPerDay);
      const target = dayToLinearIndex(6, 2, hoursPerDay);
      const range = config.computeRange(anchor, target);
      // span = target - anchor + 1 = (6*20+2) - (5*20+15) + 1 = 122-115+1 = 8 slots
      expect(range).not.toBeNull();
      expect(range?.startIdx).toBe(anchor);
      expect(range?.endIdx).toBe(target);
    });

    it("rejects selection spanning more than 1 day gap", () => {
      const { config } = makeConfig();
      // Monday (dayColIdx=1) → Wednesday (dayColIdx=3) — 2-day gap
      const anchor = dayToLinearIndex(1, 5, hoursPerDay);
      const target = dayToLinearIndex(3, 5, hoursPerDay);
      expect(config.computeRange(anchor, target)).toBeNull();
    });

    it("rejects selection exceeding hoursPerDay slots", () => {
      const { config } = makeConfig();
      // Sat hourIdx 0 → Sun hourIdx 19 = 40 slots > 20
      const anchor = dayToLinearIndex(5, 0, hoursPerDay);
      const target = dayToLinearIndex(6, hoursPerDay - 1, hoursPerDay);
      expect(config.computeRange(anchor, target)).toBeNull();
    });
  });

  describe("commitRange reports correct dayKeys", () => {
    it("reports same dayKey for same-day range", () => {
      const { config, onCommitRange } = makeConfig();
      // Sat hourIdx 4 → hourIdx 6
      const start = dayToLinearIndex(5, 4, hoursPerDay);
      const end = dayToLinearIndex(5, 6, hoursPerDay);
      config.commitRange(start, end);
      expect(onCommitRange).toHaveBeenCalledWith(
        "2026-03-07",
        4,
        "2026-03-07",
        6,
      );
    });

    it("reports different dayKeys for cross-day range", () => {
      const { config, onCommitRange } = makeConfig();
      // Sat hourIdx 17 → Sun hourIdx 2
      const start = dayToLinearIndex(5, 17, hoursPerDay);
      const end = dayToLinearIndex(6, 2, hoursPerDay);
      config.commitRange(start, end);
      expect(onCommitRange).toHaveBeenCalledWith(
        "2026-03-07",
        17,
        "2026-03-08",
        2,
      );
    });
  });

  describe("clampToContiguous", () => {
    it("clamps to adjacent day boundary", () => {
      const { config } = makeConfig();
      // Sat hourIdx 15, target far into Sunday — should clamp
      const anchor = dayToLinearIndex(5, 15, hoursPerDay);
      const target = dayToLinearIndex(6, hoursPerDay - 1, hoursPerDay);
      const clamped = config.clampToContiguous(anchor, target);
      // Should stop at hoursPerDay slots from anchor
      const maxReach = anchor + hoursPerDay - 1;
      expect(clamped).toBeLessThanOrEqual(maxReach);
      expect(clamped).toBeGreaterThanOrEqual(anchor);
    });

    it("rejects target 2+ days away", () => {
      const { config } = makeConfig();
      const anchor = dayToLinearIndex(1, 5, hoursPerDay);
      const target = dayToLinearIndex(3, 5, hoursPerDay);
      expect(config.clampToContiguous(anchor, target)).toBe(anchor);
    });
  });

  describe("blocked cells prevent selection", () => {
    it("rejects range crossing a blocked cell", () => {
      const blocksByDay = new Map([
        [
          "2026-03-07",
          [
            {
              topOffset: 10 * TIMELINE_ROW_HEIGHT,
              height: TIMELINE_ROW_HEIGHT,
            },
          ],
        ],
      ]);
      const { config } = makeConfig({ blocksByDay });
      // Sat hourIdx 9 → hourIdx 11, blocked cell at 10
      const anchor = dayToLinearIndex(5, 9, hoursPerDay);
      const target = dayToLinearIndex(5, 11, hoursPerDay);
      expect(config.computeRange(anchor, target)).toBeNull();
    });
  });
});
