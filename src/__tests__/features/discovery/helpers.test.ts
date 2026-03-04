import { describe, expect, it } from "vitest";
import {
  buildSlotsByDayKey,
  filterSlotsByDayKey,
  getPlaceVerificationDisplay,
  groupSlotsByDayKey,
  mapAvailabilityOptionsToSlots,
} from "@/features/discovery/helpers";

// ---------------------------------------------------------------------------
// Cross-midnight booking scenario fixtures
// ---------------------------------------------------------------------------
// A reservation at 2026-03-05T15:00:00Z (UTC) = 2026-03-05T23:00:00+08:00 (PHT)
// ending at 2026-03-06T10:00:00Z = 2026-03-06T18:00:00+08:00 (PHT)
// This is a cross-midnight booking spanning 11 PM Mar 5 → 2 AM Mar 6 (PHT).
const TZ = "Asia/Manila"; // UTC+8

const crossMidnightOptions = [
  {
    courtId: "court-1",
    startTime: "2026-03-05T14:00:00.000Z", // 10 PM PHT
    endTime: "2026-03-05T15:00:00.000Z",
    totalPriceCents: 50000,
    currency: "PHP",
    status: "AVAILABLE",
  },
  {
    courtId: "court-1",
    startTime: "2026-03-05T15:00:00.000Z", // 11 PM PHT — BOOKED
    endTime: "2026-03-05T16:00:00.000Z",
    totalPriceCents: 50000,
    currency: "PHP",
    status: "BOOKED",
  },
  {
    courtId: "court-1",
    startTime: "2026-03-05T16:00:00.000Z", // 12 AM Mar 6 PHT — BOOKED
    endTime: "2026-03-05T17:00:00.000Z",
    totalPriceCents: 50000,
    currency: "PHP",
    status: "BOOKED",
  },
  {
    courtId: "court-1",
    startTime: "2026-03-05T17:00:00.000Z", // 1 AM Mar 6 PHT — BOOKED
    endTime: "2026-03-05T18:00:00.000Z",
    totalPriceCents: 50000,
    currency: "PHP",
    status: "BOOKED",
  },
  {
    courtId: "court-1",
    startTime: "2026-03-05T18:00:00.000Z", // 2 AM Mar 6 PHT
    endTime: "2026-03-05T19:00:00.000Z",
    totalPriceCents: 50000,
    currency: "PHP",
    status: "AVAILABLE",
  },
];

// ---------------------------------------------------------------------------
// mapAvailabilityOptionsToSlots
// ---------------------------------------------------------------------------

describe("mapAvailabilityOptionsToSlots", () => {
  const cases = [
    {
      label: "maps BOOKED status to lowercase booked",
      options: [crossMidnightOptions[1]!],
      durationMinutes: 60,
      expected: { status: "booked" },
    },
    {
      label: "maps AVAILABLE status to lowercase available",
      options: [crossMidnightOptions[0]!],
      durationMinutes: 60,
      expected: { status: "available" },
    },
    {
      label: "preserves startTime and endTime from options",
      options: [crossMidnightOptions[1]!],
      durationMinutes: 60,
      expected: {
        startTime: "2026-03-05T15:00:00.000Z",
        endTime: "2026-03-05T16:00:00.000Z",
      },
    },
    {
      label: "defaults currency to PHP when null",
      options: [{ ...crossMidnightOptions[0]!, currency: null }],
      durationMinutes: 60,
      expected: { currency: "PHP" },
    },
  ];

  for (const { label, options, durationMinutes, expected } of cases) {
    it(label, () => {
      const slots = mapAvailabilityOptionsToSlots(options, durationMinutes);
      expect(slots[0]).toEqual(expect.objectContaining(expected));
    });
  }

  it("maps all cross-midnight booked slots correctly", () => {
    const slots = mapAvailabilityOptionsToSlots(crossMidnightOptions, 60);
    const statuses = slots.map((s) => s.status);
    expect(statuses).toEqual([
      "available",
      "booked",
      "booked",
      "booked",
      "available",
    ]);
  });
});

// ---------------------------------------------------------------------------
// filterSlotsByDayKey
// ---------------------------------------------------------------------------

describe("filterSlotsByDayKey", () => {
  it("returns only Mar 5 slots when selected day is Mar 5", () => {
    const slots = mapAvailabilityOptionsToSlots(crossMidnightOptions, 60);
    const mar5 = filterSlotsByDayKey(slots, "2026-03-05", TZ);

    expect(mar5.map((slot) => slot.startTime)).toEqual([
      "2026-03-05T14:00:00.000Z",
      "2026-03-05T15:00:00.000Z",
    ]);
    expect(mar5.map((slot) => slot.status)).toEqual(["available", "booked"]);
  });

  it("returns only Mar 6 slots when selected day is Mar 6", () => {
    const slots = mapAvailabilityOptionsToSlots(crossMidnightOptions, 60);
    const mar6 = filterSlotsByDayKey(slots, "2026-03-06", TZ);

    expect(mar6.map((slot) => slot.startTime)).toEqual([
      "2026-03-05T16:00:00.000Z",
      "2026-03-05T17:00:00.000Z",
      "2026-03-05T18:00:00.000Z",
    ]);
    expect(mar6.map((slot) => slot.status)).toEqual([
      "booked",
      "booked",
      "available",
    ]);
  });

  it("sorts filtered slots by startTime ascending", () => {
    const slots = mapAvailabilityOptionsToSlots(crossMidnightOptions, 60);
    const reversed = [...slots].reverse();
    const mar5 = filterSlotsByDayKey(reversed, "2026-03-05", TZ);

    expect(mar5.map((slot) => slot.startTime)).toEqual([
      "2026-03-05T14:00:00.000Z",
      "2026-03-05T15:00:00.000Z",
    ]);
  });
});

// ---------------------------------------------------------------------------
// groupSlotsByDayKey
// ---------------------------------------------------------------------------

describe("groupSlotsByDayKey", () => {
  it("groups 11 PM PHT slot under Mar 5 day key", () => {
    const slots = mapAvailabilityOptionsToSlots(crossMidnightOptions, 60);
    const byDay = groupSlotsByDayKey(slots, TZ);

    const mar5Slots = byDay.get("2026-03-05");
    expect(mar5Slots).toBeDefined();
    // 10 PM and 11 PM PHT are both on Mar 5
    expect(mar5Slots).toHaveLength(2);
    expect(mar5Slots![1]!.status).toBe("booked"); // 11 PM
  });

  it("groups midnight and 1 AM PHT slots under Mar 6 day key", () => {
    const slots = mapAvailabilityOptionsToSlots(crossMidnightOptions, 60);
    const byDay = groupSlotsByDayKey(slots, TZ);

    const mar6Slots = byDay.get("2026-03-06");
    expect(mar6Slots).toBeDefined();
    // 12 AM, 1 AM, 2 AM PHT on Mar 6
    expect(mar6Slots).toHaveLength(3);
    expect(mar6Slots![0]!.status).toBe("booked"); // 12 AM
    expect(mar6Slots![1]!.status).toBe("booked"); // 1 AM
    expect(mar6Slots![2]!.status).toBe("available"); // 2 AM
  });

  it("sorts slots within each day by startTime ascending", () => {
    const slots = mapAvailabilityOptionsToSlots(crossMidnightOptions, 60);
    const byDay = groupSlotsByDayKey(slots, TZ);

    for (const [, daySlots] of byDay) {
      for (let i = 1; i < daySlots.length; i++) {
        expect(daySlots[i]!.startTime >= daySlots[i - 1]!.startTime).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// buildSlotsByDayKey
// ---------------------------------------------------------------------------

describe("buildSlotsByDayKey", () => {
  it("combines mapping and grouping for cross-midnight scenario", () => {
    const byDay = buildSlotsByDayKey(crossMidnightOptions, TZ, 60);

    // Verify Mar 5 has the 11 PM booked slot
    const mar5 = byDay.get("2026-03-05");
    expect(mar5).toBeDefined();
    const bookedOnMar5 = mar5!.filter((s) => s.status === "booked");
    expect(bookedOnMar5).toHaveLength(1);
    expect(bookedOnMar5[0]!.startTime).toBe("2026-03-05T15:00:00.000Z");

    // Verify Mar 6 has midnight and 1 AM booked
    const mar6 = byDay.get("2026-03-06");
    expect(mar6).toBeDefined();
    const bookedOnMar6 = mar6!.filter((s) => s.status === "booked");
    expect(bookedOnMar6).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getPlaceVerificationDisplay
// ---------------------------------------------------------------------------

describe("getPlaceVerificationDisplay", () => {
  it("hides booking and shows payment method messaging when payment methods are missing", () => {
    const result = getPlaceVerificationDisplay({
      placeType: "RESERVABLE",
      verificationStatus: "VERIFIED",
      reservationsEnabled: true,
      hasPaymentMethods: false,
    });

    expect(result.showBooking).toBe(false);
    expect(result.verificationMessage).toBe("Payment method required");
    expect(result.verificationStatusVariant).toBe("warning");
  });

  it("shows booking when all reservation requirements are satisfied", () => {
    const result = getPlaceVerificationDisplay({
      placeType: "RESERVABLE",
      verificationStatus: "VERIFIED",
      reservationsEnabled: true,
      hasPaymentMethods: true,
    });

    expect(result.showBooking).toBe(true);
    expect(result.verificationMessage).toBe("Verified for reservations");
  });

  it("prioritizes verification status messaging ahead of payment messaging", () => {
    const result = getPlaceVerificationDisplay({
      placeType: "RESERVABLE",
      verificationStatus: "PENDING",
      reservationsEnabled: true,
      hasPaymentMethods: false,
    });

    expect(result.showBooking).toBe(false);
    expect(result.verificationMessage).toBe("Verification pending");
    expect(result.verificationStatusVariant).toBe("warning");
  });
});
