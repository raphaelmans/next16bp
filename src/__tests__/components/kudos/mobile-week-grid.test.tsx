import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AvailabilityWeekGrid } from "@/components/kudos/availability-week-grid";
import { MobileWeekGrid } from "@/components/kudos/mobile-week-grid";
import type { TimeSlot } from "@/components/kudos/time-slot-picker";

const DAY_KEYS = [
  "2026-03-01",
  "2026-03-02",
  "2026-03-03",
  "2026-03-04",
  "2026-03-05",
  "2026-03-06",
  "2026-03-07",
];

function makeSlot(dayKey: string, hour: number): TimeSlot {
  const start = new Date(`${dayKey}T00:00:00.000Z`);
  start.setUTCHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    id: `${dayKey}-${hour}`,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    priceCents: 50000,
    currency: "PHP",
    status: "available",
  };
}

function makeDaySlots(dayKey: string, hours: number[]): TimeSlot[] {
  return hours.map((hour) => makeSlot(dayKey, hour));
}

describe("MobileWeekGrid row hours", () => {
  it("uses the same union-of-week hours model as desktop week grid", () => {
    const selectedDayKey = "2026-03-05";
    const selectedDayHours = [
      6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1,
      2,
    ];

    const slotsByDay = new Map<string, TimeSlot[]>([
      [selectedDayKey, makeDaySlots(selectedDayKey, selectedDayHours)],
      // Outlier day includes 3/4/5, which should not force extra rows on all columns.
      [
        "2026-03-06",
        makeDaySlots("2026-03-06", [...selectedDayHours, 3, 4, 5]),
      ],
    ]);

    render(
      <MobileWeekGrid
        dayKeys={DAY_KEYS}
        slotsByDay={slotsByDay}
        timeZone="UTC"
        onRangeChange={vi.fn()}
        onClear={vi.fn()}
        todayDayKey="2026-03-01"
        maxDayKey="2026-03-31"
      />,
    );

    expect(screen.getByText("2 AM")).toBeTruthy();
    expect(screen.getByText("11 PM")).toBeTruthy();
    expect(screen.getByText("3 AM")).toBeTruthy();
    expect(screen.getByText("4 AM")).toBeTruthy();
    expect(screen.getByText("5 AM")).toBeTruthy();
  });

  it("renders the same cell count as AvailabilityWeekGrid for identical inputs", () => {
    const slotsByDay = new Map<string, TimeSlot[]>([
      ["2026-03-05", makeDaySlots("2026-03-05", [19, 20, 21, 22, 23])],
      ["2026-03-06", makeDaySlots("2026-03-06", [0, 1, 2, 19, 20, 21])],
    ]);

    const mobile = render(
      <MobileWeekGrid
        dayKeys={DAY_KEYS}
        slotsByDay={slotsByDay}
        timeZone="UTC"
        onRangeChange={vi.fn()}
        onClear={vi.fn()}
        todayDayKey="2026-03-01"
        maxDayKey="2026-03-31"
      />,
    );

    const desktop = render(
      <AvailabilityWeekGrid
        dayKeys={DAY_KEYS}
        slotsByDay={slotsByDay}
        timeZone="UTC"
        onRangeChange={vi.fn()}
        onDayClick={vi.fn()}
        todayDayKey="2026-03-01"
        maxDayKey="2026-03-31"
      />,
    );

    const mobileCells = mobile.container.querySelectorAll(
      "button[aria-pressed]",
    );
    const desktopCells = desktop.container.querySelectorAll(
      "button[aria-pressed]",
    );

    expect(mobileCells.length).toBe(desktopCells.length);
  });
});
