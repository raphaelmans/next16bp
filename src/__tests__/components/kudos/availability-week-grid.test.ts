import { describe, expect, it } from "vitest";
import {
  getHourFromSlot,
  getWeekGridDayCueState,
  isSlotAvailable,
  isSlotSelectable,
} from "@/components/kudos/availability-week-grid";
import type { TimeSlot } from "@/components/kudos/time-slot-picker";
import { sortHoursInScheduleOrder } from "@/common/schedule-hours";

// ---------------------------------------------------------------------------
// Fixtures — cross-midnight booking scenario
// ---------------------------------------------------------------------------
// Asia/Manila (UTC+8). A 3-hour reservation starting at 11 PM PHT Mar 5.
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

// 10 PM PHT (14:00 UTC) — available
const slot22 = makeSlot(
  "2026-03-05T14:00:00.000Z",
  "2026-03-05T15:00:00.000Z",
  "available",
);
// 11 PM PHT (15:00 UTC) — booked (cross-midnight start)
const slot23 = makeSlot(
  "2026-03-05T15:00:00.000Z",
  "2026-03-05T16:00:00.000Z",
  "booked",
);
// 12 AM PHT (16:00 UTC) — booked (midnight, next calendar day)
const slot0 = makeSlot(
  "2026-03-05T16:00:00.000Z",
  "2026-03-05T17:00:00.000Z",
  "booked",
);
// 1 AM PHT (17:00 UTC) — booked
const slot1 = makeSlot(
  "2026-03-05T17:00:00.000Z",
  "2026-03-05T18:00:00.000Z",
  "booked",
);
// 2 AM PHT (18:00 UTC) — available
const slot2 = makeSlot(
  "2026-03-05T18:00:00.000Z",
  "2026-03-05T19:00:00.000Z",
  "available",
);

// ---------------------------------------------------------------------------
// getHourFromSlot
// ---------------------------------------------------------------------------

describe("getHourFromSlot", () => {
  const cases = [
    {
      label: "extracts hour 22 for 10 PM PHT slot",
      slot: slot22,
      expected: 22,
    },
    {
      label: "extracts hour 23 for 11 PM PHT slot (cross-midnight start)",
      slot: slot23,
      expected: 23,
    },
    {
      label: "extracts hour 0 for 12 AM PHT slot (after midnight)",
      slot: slot0,
      expected: 0,
    },
    { label: "extracts hour 1 for 1 AM PHT slot", slot: slot1, expected: 1 },
    { label: "extracts hour 2 for 2 AM PHT slot", slot: slot2, expected: 2 },
  ];

  for (const { label, slot, expected } of cases) {
    it(label, () => {
      expect(getHourFromSlot(slot, TZ)).toBe(expected);
    });
  }
});

// ---------------------------------------------------------------------------
// isSlotAvailable & isSlotSelectable (desktop grid)
// ---------------------------------------------------------------------------

describe("isSlotAvailable", () => {
  it("returns false for booked cross-midnight slot", () => {
    expect(isSlotAvailable(slot23)).toBe(false);
  });

  it("returns false for booked midnight slot", () => {
    expect(isSlotAvailable(slot0)).toBe(false);
  });

  it("returns true for available slot", () => {
    expect(isSlotAvailable(slot22)).toBe(true);
  });
});

describe("isSlotSelectable", () => {
  // Use a nowMs in the past so availability alone determines selectability
  const pastNowMs = Date.parse("2026-03-01T00:00:00.000Z");

  it("returns false for booked slot even if in the future", () => {
    expect(isSlotSelectable(slot23, pastNowMs)).toBe(false);
  });

  it("returns false for booked midnight slot even if in the future", () => {
    expect(isSlotSelectable(slot0, pastNowMs)).toBe(false);
  });

  it("returns true for available future slot", () => {
    expect(isSlotSelectable(slot22, pastNowMs)).toBe(true);
  });

  it("returns false for available slot in the past", () => {
    const futureNowMs = Date.parse("2026-03-06T00:00:00.000Z");
    expect(isSlotSelectable(slot22, futureNowMs)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// slotLookup simulation (replicates the memo logic from AvailabilityWeekGrid)
// ---------------------------------------------------------------------------

describe("slotLookup for cross-midnight booking", () => {
  // Build slotsByDay as the component would receive it
  const slotsByDay = new Map<string, TimeSlot[]>();
  slotsByDay.set("2026-03-05", [slot22, slot23]);
  slotsByDay.set("2026-03-06", [slot0, slot1, slot2]);

  // Replicate the slotLookup memo
  const slotLookup = new Map<string, Map<number, TimeSlot>>();
  for (const [dk, slots] of slotsByDay) {
    const hourMap = new Map<number, TimeSlot>();
    for (const slot of slots) {
      hourMap.set(getHourFromSlot(slot, TZ), slot);
    }
    slotLookup.set(dk, hourMap);
  }

  it("maps hour 23 on Mar 5 to the booked slot", () => {
    const slot = slotLookup.get("2026-03-05")?.get(23);
    expect(slot).toBeDefined();
    expect(slot!.status).toBe("booked");
  });

  it("maps hour 0 on Mar 6 to the booked midnight slot", () => {
    const slot = slotLookup.get("2026-03-06")?.get(0);
    expect(slot).toBeDefined();
    expect(slot!.status).toBe("booked");
  });

  it("maps hour 22 on Mar 5 to the available slot", () => {
    const slot = slotLookup.get("2026-03-05")?.get(22);
    expect(slot).toBeDefined();
    expect(slot!.status).toBe("available");
  });

  it("renders cell as disabled when slot is booked", () => {
    const slot = slotLookup.get("2026-03-05")?.get(23);
    // This replicates the WeekGridCell logic: disabled={isDisabled || !available}
    const available = slot ? isSlotAvailable(slot) : false;
    const isBooked = slot?.status === "booked" || slot?.status === "held";
    expect(available).toBe(false);
    expect(isBooked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// allHours with sortHoursInScheduleOrder
// ---------------------------------------------------------------------------

describe("allHours derivation for 24-hour court", () => {
  it("returns all 24 hours in schedule order for a full-day court", () => {
    // A 24-hour court has slots for every hour
    const hourSet = new Set<number>();
    for (let h = 0; h < 24; h++) {
      hourSet.add(h);
    }
    const allHours = sortHoursInScheduleOrder(Array.from(hourSet));
    expect(allHours).toHaveLength(24);
    expect(allHours[0]).toBe(0);
    expect(allHours[23]).toBe(23);
  });

  it("preserves schedule order for overnight court (6 AM–2 AM)", () => {
    // Hours: 6–23, 0, 1
    const hourSet = new Set<number>([
      6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1,
    ]);
    const allHours = sortHoursInScheduleOrder(Array.from(hourSet));
    // Should start at 6, wrap through 23, then 0, 1
    expect(allHours[0]).toBe(6);
    expect(allHours[allHours.length - 1]).toBe(1);
    expect(allHours[allHours.length - 2]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getWeekGridDayCueState
// ---------------------------------------------------------------------------

describe("getWeekGridDayCueState", () => {
  it.each([
    {
      label: "returns none when cue mode is none",
      input: {
        dayKey: "2026-02-24",
        sameDayAnchorDayKey: "2026-02-24",
        cueMode: "none" as const,
      },
      expected: "none",
    },
    {
      label: "returns none when anchor day key is missing",
      input: {
        dayKey: "2026-02-24",
        sameDayAnchorDayKey: undefined,
        cueMode: "highlight-anchor" as const,
      },
      expected: "none",
    },
    {
      label: "returns anchor when day matches anchor in highlight mode",
      input: {
        dayKey: "2026-02-24",
        sameDayAnchorDayKey: "2026-02-24",
        cueMode: "highlight-anchor" as const,
      },
      expected: "anchor",
    },
    {
      label: "returns none when day does not match anchor",
      input: {
        dayKey: "2026-02-25",
        sameDayAnchorDayKey: "2026-02-24",
        cueMode: "highlight-anchor" as const,
      },
      expected: "none",
    },
  ])("$label", ({ input, expected }) => {
    expect(getWeekGridDayCueState(input)).toBe(expected);
  });
});
