import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import {
  isSlotAvailable,
  isSlotSelectable,
  TimeRangePicker,
} from "@/components/kudos/time-range-picker";
import type { TimeSlot } from "@/components/kudos/time-slot-picker";

// ---------------------------------------------------------------------------
// Fixtures — cross-midnight booking scenario (mobile)
// ---------------------------------------------------------------------------
// Asia/Manila (UTC+8). On mobile, the user sees a single day at a time.
// A 3-hour reservation at 11 PM PHT Mar 5 → 2 AM PHT Mar 6.
// Mobile queries getForCourt for a single day, so slots arrive for that day.

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

// Mar 5 PHT day view — 10 PM available, 11 PM booked
const availableSlot = makeSlot(
  "2026-03-05T14:00:00.000Z",
  "2026-03-05T15:00:00.000Z",
  "available",
);
const bookedSlot11pm = makeSlot(
  "2026-03-05T15:00:00.000Z",
  "2026-03-05T16:00:00.000Z",
  "booked",
);
// Mar 6 PHT day view — midnight booked, 1 AM booked, 2 AM available
const bookedSlotMidnight = makeSlot(
  "2026-03-05T16:00:00.000Z",
  "2026-03-05T17:00:00.000Z",
  "booked",
);
const bookedSlot1am = makeSlot(
  "2026-03-05T17:00:00.000Z",
  "2026-03-05T18:00:00.000Z",
  "booked",
);

// ---------------------------------------------------------------------------
// isSlotAvailable (mobile)
// ---------------------------------------------------------------------------

describe("isSlotAvailable", () => {
  const cases = [
    {
      label: "returns false for 11 PM booked slot",
      slot: bookedSlot11pm,
      expected: false,
    },
    {
      label: "returns false for midnight booked slot",
      slot: bookedSlotMidnight,
      expected: false,
    },
    {
      label: "returns false for 1 AM booked slot",
      slot: bookedSlot1am,
      expected: false,
    },
    {
      label: "returns true for available slot",
      slot: availableSlot,
      expected: true,
    },
  ];

  for (const { label, slot, expected } of cases) {
    it(label, () => {
      expect(isSlotAvailable(slot)).toBe(expected);
    });
  }
});

// ---------------------------------------------------------------------------
// isSlotSelectable (mobile)
// ---------------------------------------------------------------------------

describe("isSlotSelectable", () => {
  // nowMs in the past so only status determines selectability
  const pastNowMs = Date.parse("2026-03-01T00:00:00.000Z");

  it("returns false for 11 PM booked slot even when in the future", () => {
    expect(isSlotSelectable(bookedSlot11pm, pastNowMs)).toBe(false);
  });

  it("returns false for midnight booked slot even when in the future", () => {
    expect(isSlotSelectable(bookedSlotMidnight, pastNowMs)).toBe(false);
  });

  it("returns true for available future slot", () => {
    expect(isSlotSelectable(availableSlot, pastNowMs)).toBe(true);
  });

  it("returns false for available slot that is in the past", () => {
    const futureNowMs = Date.parse("2026-03-06T00:00:00.000Z");
    expect(isSlotSelectable(availableSlot, futureNowMs)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Mobile slot rendering logic simulation
// ---------------------------------------------------------------------------

describe("mobile TimeSlotRow rendering logic for cross-midnight booking", () => {
  // Simulates the TimeSlotRow logic:
  //   available = isSlotAvailable(slot) && !isPast
  //   isBooked = slot.status === "booked"
  //   button disabled when !available

  it("disables the 11 PM booked slot button", () => {
    const available = isSlotAvailable(bookedSlot11pm);
    const isBooked = bookedSlot11pm.status === "booked";
    const disabled = !available;
    expect(disabled).toBe(true);
    expect(isBooked).toBe(true);
  });

  it("disables the midnight booked slot button", () => {
    const available = isSlotAvailable(bookedSlotMidnight);
    const isBooked = bookedSlotMidnight.status === "booked";
    const disabled = !available;
    expect(disabled).toBe(true);
    expect(isBooked).toBe(true);
  });

  it("enables the available slot button", () => {
    const available = isSlotAvailable(availableSlot);
    const isBooked = availableSlot.status === "booked";
    const disabled = !available;
    expect(disabled).toBe(false);
    expect(isBooked).toBe(false);
  });
});

describe("TimeRangePicker day-context rendering", () => {
  const timezone = "Asia/Manila";
  const selectedDayKey = "2099-03-05";
  const crossDaySlots: TimeSlot[] = [
    makeSlot("2099-03-05T15:00:00.000Z", "2099-03-05T16:00:00.000Z", "booked"),
    makeSlot(
      "2099-03-05T16:00:00.000Z",
      "2099-03-05T17:00:00.000Z",
      "available",
    ),
    makeSlot(
      "2099-03-06T15:00:00.000Z",
      "2099-03-06T16:00:00.000Z",
      "available",
    ),
  ];

  it("renders date headers when day slots spill into the next day", () => {
    render(
      React.createElement(TimeRangePicker, {
        slots: crossDaySlots,
        timeZone: timezone,
        selectedDayKey,
      }),
    );

    expect(screen.getByText(/Mar 5/i)).toBeTruthy();
    expect(screen.getAllByText(/Mar 6/i).length).toBeGreaterThan(0);
  });

  it("keeps selected-day booked slot disabled and next-day duplicate hour selectable", () => {
    render(
      React.createElement(TimeRangePicker, {
        slots: crossDaySlots,
        timeZone: timezone,
        selectedDayKey,
      }),
    );

    const selectedDayBooked11Pm = screen.getByRole("button", {
      name: /11:00 PM to 12:00 AM \(unavailable\)/i,
    });
    expect(selectedDayBooked11Pm.hasAttribute("disabled")).toBe(true);

    const nextDay11Pm = screen.getByRole("button", {
      name: /Mar 6, 11:00 PM to 12:00 AM/i,
    });
    expect(nextDay11Pm.hasAttribute("disabled")).toBe(false);
  });

  it("does not auto-select midnight when prior-day selection ends at day boundary", () => {
    render(
      React.createElement(TimeRangePicker, {
        slots: [
          makeSlot(
            "2099-03-05T16:00:00.000Z",
            "2099-03-05T17:00:00.000Z",
            "available",
          ), // 12:00 AM-1:00 AM Mar 6 PHT
        ],
        timeZone: timezone,
        selectedDayKey: "2099-03-06",
        selectedStartTime: "2099-03-05T15:00:00.000Z", // 11:00 PM Mar 5 PHT
        selectedDurationMinutes: 60,
      }),
    );

    expect(screen.queryByText(/Click another slot to extend/i)).toBeFalsy();
  });

  it("keeps visible highlight when a same-day selection spills past day end", () => {
    render(
      React.createElement(TimeRangePicker, {
        slots: [
          makeSlot(
            "2099-03-05T14:00:00.000Z",
            "2099-03-05T15:00:00.000Z",
            "available",
          ), // 10:00 PM Mar 5 PHT
          makeSlot(
            "2099-03-05T15:00:00.000Z",
            "2099-03-05T16:00:00.000Z",
            "available",
          ), // 11:00 PM Mar 5 PHT
        ],
        timeZone: timezone,
        selectedDayKey: "2099-03-05",
        selectedStartTime: "2099-03-05T14:00:00.000Z",
        selectedDurationMinutes: 300, // spills into Mar 6
      }),
    );

    expect(screen.getByText("10:00 PM – 12:00 AM")).toBeTruthy();
  });
});
