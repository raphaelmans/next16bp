import { describe, expect, it } from "vitest";
import type { TimeSlot } from "@/components/kudos/time-slot-picker";
import {
  buildWeekGridHourModel,
  deriveWeekGridCommittedRange,
  toWeekGridLinearIndex,
} from "@/components/kudos/week-grid-domain";

function makeSlot(
  dayKey: string,
  hour: number,
  status: "available" | "booked" = "available",
): TimeSlot {
  const [year, month, day] = dayKey.split("-").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    throw new Error(`Invalid dayKey: ${dayKey}`);
  }
  const start = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    id: `${dayKey}-${hour}`,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    priceCents: 50000,
    currency: "PHP",
    status,
  };
}

describe("week-grid-domain", () => {
  it("buildWeekGridHourModel derives desktop schedule-order hours and lookup map", () => {
    const slotsByDay = new Map<string, TimeSlot[]>([
      ["2026-03-05", [makeSlot("2026-03-05", 22), makeSlot("2026-03-05", 23)]],
      [
        "2026-03-06",
        [
          makeSlot("2026-03-06", 0, "booked"),
          makeSlot("2026-03-06", 1),
          makeSlot("2026-03-06", 2),
        ],
      ],
    ]);

    const model = buildWeekGridHourModel(slotsByDay, "UTC");

    expect(model.allHours).toEqual([22, 23, 0, 1, 2]);
    expect(model.hoursPerDay).toBe(5);
    expect(model.slotLookup.get("2026-03-05")?.get(23)?.status).toBe(
      "available",
    );
    expect(model.slotLookup.get("2026-03-06")?.get(0)?.status).toBe("booked");
  });

  it("buildWeekGridHourModel only uses rendered dayKeys when provided", () => {
    const slotsByDay = new Map<string, TimeSlot[]>([
      ["2026-03-05", [makeSlot("2026-03-05", 22), makeSlot("2026-03-05", 23)]],
      ["2026-03-06", [makeSlot("2026-03-06", 0), makeSlot("2026-03-06", 1)]],
      ["2026-03-08", [makeSlot("2026-03-08", 6), makeSlot("2026-03-08", 7)]],
    ]);

    const model = buildWeekGridHourModel(slotsByDay, "UTC", [
      "2026-03-05",
      "2026-03-06",
    ]);

    expect(model.allHours).toEqual([22, 23, 0, 1]);
    expect(model.slotLookup.has("2026-03-08")).toBe(false);
  });

  it("deriveWeekGridCommittedRange wraps end index into the next day column", () => {
    const dayKeys = ["2026-03-05", "2026-03-06"];
    const slotsByDay = new Map<string, TimeSlot[]>([
      [
        "2026-03-05",
        [
          makeSlot("2026-03-05", 10),
          makeSlot("2026-03-05", 11),
          makeSlot("2026-03-05", 12),
        ],
      ],
      [
        "2026-03-06",
        [
          makeSlot("2026-03-06", 10),
          makeSlot("2026-03-06", 11),
          makeSlot("2026-03-06", 12),
        ],
      ],
    ]);

    const { allHours, slotLookup, hoursPerDay } = buildWeekGridHourModel(
      slotsByDay,
      "UTC",
    );
    const startSlot = slotsByDay
      .get("2026-03-05")
      ?.find((slot) => slot.id === "2026-03-05-12");

    const range = deriveWeekGridCommittedRange({
      selectedRange: {
        startTime: startSlot?.startTime ?? "",
        durationMinutes: 120,
      },
      dayKeys,
      slotLookup,
      allHours,
      hoursPerDay,
      nowMs: Date.parse("2026-03-01T00:00:00.000Z"),
    });

    expect(range).toEqual({
      startIdx: toWeekGridLinearIndex(0, 2, hoursPerDay),
      endIdx: toWeekGridLinearIndex(1, 0, hoursPerDay),
    });
  });

  it("deriveWeekGridCommittedRange returns null for a past selection", () => {
    const dayKeys = ["2026-03-05"];
    const slotsByDay = new Map<string, TimeSlot[]>([
      ["2026-03-05", [makeSlot("2026-03-05", 10)]],
    ]);

    const { allHours, slotLookup, hoursPerDay } = buildWeekGridHourModel(
      slotsByDay,
      "UTC",
    );
    const range = deriveWeekGridCommittedRange({
      selectedRange: {
        startTime: "2026-03-05T10:00:00.000Z",
        durationMinutes: 60,
      },
      dayKeys,
      slotLookup,
      allHours,
      hoursPerDay,
      nowMs: Date.parse("2026-03-10T00:00:00.000Z"),
    });

    expect(range).toBeNull();
  });
});
