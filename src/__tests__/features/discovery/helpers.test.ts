import { describe, expect, it } from "vitest";
import {
  buildSlotsByDayKey,
  comparePublicVenueSort,
  filterSlotsByDayKey,
  getAvailabilityErrorInfo,
  getPlaceVerificationDisplay,
  getPublicVenueSortBucket,
  groupSlotsByDayKey,
  mapAvailabilityOptionsToSlots,
  type PublicVenueSortInput,
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

const createVenue = (
  overrides: Partial<PublicVenueSortInput> & {
    id: string;
    name: string;
  },
): PublicVenueSortInput => ({
  id: overrides.id,
  name: overrides.name,
  featuredRank: overrides.featuredRank ?? 0,
  provinceRank: overrides.provinceRank ?? 0,
  placeType: overrides.placeType ?? "RESERVABLE",
  verificationStatus: overrides.verificationStatus ?? "UNVERIFIED",
  averageRating: overrides.averageRating ?? null,
  reviewCount: overrides.reviewCount ?? null,
});

// ---------------------------------------------------------------------------
// mapAvailabilityOptionsToSlots
// ---------------------------------------------------------------------------

describe("mapAvailabilityOptionsToSlots", () => {
  const cases = [
    {
      label: "maps BOOKED status to lowercase booked",
      options: crossMidnightOptions.slice(1, 2),
      durationMinutes: 60,
      expected: { status: "booked" },
    },
    {
      label: "maps AVAILABLE status to lowercase available",
      options: crossMidnightOptions.slice(0, 1),
      durationMinutes: 60,
      expected: { status: "available" },
    },
    {
      label: "preserves startTime and endTime from options",
      options: crossMidnightOptions.slice(1, 2),
      durationMinutes: 60,
      expected: {
        startTime: "2026-03-05T15:00:00.000Z",
        endTime: "2026-03-05T16:00:00.000Z",
      },
    },
    {
      label: "defaults currency to PHP when null",
      options: crossMidnightOptions
        .slice(0, 1)
        .map((option) => ({ ...option, currency: null })),
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
    expect(mar5Slots?.[1]?.status).toBe("booked"); // 11 PM
  });

  it("groups midnight and 1 AM PHT slots under Mar 6 day key", () => {
    const slots = mapAvailabilityOptionsToSlots(crossMidnightOptions, 60);
    const byDay = groupSlotsByDayKey(slots, TZ);

    const mar6Slots = byDay.get("2026-03-06");
    expect(mar6Slots).toBeDefined();
    // 12 AM, 1 AM, 2 AM PHT on Mar 6
    expect(mar6Slots).toHaveLength(3);
    expect(mar6Slots?.[0]?.status).toBe("booked"); // 12 AM
    expect(mar6Slots?.[1]?.status).toBe("booked"); // 1 AM
    expect(mar6Slots?.[2]?.status).toBe("available"); // 2 AM
  });

  it("sorts slots within each day by startTime ascending", () => {
    const slots = mapAvailabilityOptionsToSlots(crossMidnightOptions, 60);
    const byDay = groupSlotsByDayKey(slots, TZ);

    for (const [, daySlots] of byDay) {
      for (let i = 1; i < daySlots.length; i++) {
        expect(daySlots[i]?.startTime >= daySlots[i - 1]?.startTime).toBe(true);
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
    const bookedOnMar5 = mar5?.filter((s) => s.status === "booked") ?? [];
    expect(bookedOnMar5).toHaveLength(1);
    expect(bookedOnMar5[0]?.startTime).toBe("2026-03-05T15:00:00.000Z");

    // Verify Mar 6 has midnight and 1 AM booked
    const mar6 = byDay.get("2026-03-06");
    expect(mar6).toBeDefined();
    const bookedOnMar6 = mar6?.filter((s) => s.status === "booked") ?? [];
    expect(bookedOnMar6).toHaveLength(2);
  });
});

describe("getAvailabilityErrorInfo", () => {
  it("marks rate-limited errors separately from generic failures", () => {
    const errorInfo = getAvailabilityErrorInfo(
      {
        kind: "rate_limited",
        message: "Too many requests",
      },
      () => undefined,
    );

    expect(errorInfo).toMatchObject({
      isError: true,
      isBookingWindowError: false,
      isRateLimited: true,
    });
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

  it("keeps booking visible for pending venues and shows a warning message", () => {
    const result = getPlaceVerificationDisplay({
      placeType: "RESERVABLE",
      verificationStatus: "PENDING",
      reservationsEnabled: true,
      hasPaymentMethods: true,
    });

    expect(result.showBooking).toBe(true);
    expect(result.showBookingVerificationUi).toBe(true);
    expect(result.showVerificationBadge).toBe(false);
    expect(result.verificationMessage).toBe(
      "Booking available while verification is pending",
    );
    expect(result.verificationStatusVariant).toBe("warning");
  });

  it("keeps booking visible for rejected venues and shows a warning message", () => {
    const result = getPlaceVerificationDisplay({
      placeType: "RESERVABLE",
      verificationStatus: "REJECTED",
      reservationsEnabled: true,
      hasPaymentMethods: true,
    });

    expect(result.showBooking).toBe(true);
    expect(result.showBookingVerificationUi).toBe(true);
    expect(result.showVerificationBadge).toBe(false);
    expect(result.verificationMessage).toBe(
      "Booking available while verification needs updates",
    );
    expect(result.verificationStatusVariant).toBe("destructive");
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

// ---------------------------------------------------------------------------
// public venue ranking
// ---------------------------------------------------------------------------

describe("getPublicVenueSortBucket", () => {
  it("applies the public ranking buckets in the expected order", () => {
    expect(
      getPublicVenueSortBucket(
        createVenue({
          id: "featured",
          name: "Featured",
          featuredRank: 1,
          provinceRank: 1,
          verificationStatus: "VERIFIED",
          reviewCount: 12,
        }),
      ),
    ).toBe(0);
    expect(
      getPublicVenueSortBucket(
        createVenue({
          id: "province",
          name: "Province",
          provinceRank: 1,
          verificationStatus: "VERIFIED",
          reviewCount: 12,
        }),
      ),
    ).toBe(1);
    expect(
      getPublicVenueSortBucket(
        createVenue({
          id: "verified-reviewed",
          name: "Verified Reviewed",
          verificationStatus: "VERIFIED",
          reviewCount: 3,
        }),
      ),
    ).toBe(2);
    expect(
      getPublicVenueSortBucket(
        createVenue({
          id: "verified",
          name: "Verified",
          verificationStatus: "VERIFIED",
        }),
      ),
    ).toBe(3);
    expect(
      getPublicVenueSortBucket(
        createVenue({
          id: "reviewed",
          name: "Reviewed",
          reviewCount: 1,
          averageRating: 1,
        }),
      ),
    ).toBe(4);
    expect(
      getPublicVenueSortBucket(
        createVenue({
          id: "unreviewed",
          name: "Unreviewed",
        }),
      ),
    ).toBe(5);
  });
});

describe("comparePublicVenueSort", () => {
  it("sorts venues using featured, province, verification, and review precedence", () => {
    const venues = [
      createVenue({
        id: "reviewed",
        name: "Reviewed",
        reviewCount: 1,
        averageRating: 1,
      }),
      createVenue({
        id: "verified",
        name: "Verified",
        verificationStatus: "VERIFIED",
      }),
      createVenue({
        id: "verified-reviewed",
        name: "Verified Reviewed",
        verificationStatus: "VERIFIED",
        reviewCount: 2,
        averageRating: 4.5,
      }),
      createVenue({
        id: "province",
        name: "Province",
        provinceRank: 2,
      }),
      createVenue({
        id: "featured",
        name: "Featured",
        featuredRank: 3,
      }),
      createVenue({
        id: "none",
        name: "None",
      }),
    ];

    const sorted = venues.toSorted(comparePublicVenueSort);

    expect(sorted.map((venue) => venue.id)).toEqual([
      "featured",
      "province",
      "verified-reviewed",
      "verified",
      "reviewed",
      "none",
    ]);
  });

  it("prefers any reviewed venue over an unreviewed venue even at one star", () => {
    const sorted = [
      createVenue({
        id: "no-reviews",
        name: "No Reviews",
      }),
      createVenue({
        id: "one-star",
        name: "One Star",
        reviewCount: 1,
        averageRating: 1,
      }),
    ].toSorted(comparePublicVenueSort);

    expect(sorted.map((venue) => venue.id)).toEqual(["one-star", "no-reviews"]);
  });

  it("uses review count, then rating, then name as tie-breakers inside review buckets", () => {
    const sorted = [
      createVenue({
        id: "alpha",
        name: "Alpha",
        reviewCount: 2,
        averageRating: 4.5,
      }),
      createVenue({
        id: "beta",
        name: "Beta",
        reviewCount: 5,
        averageRating: 3.5,
      }),
      createVenue({
        id: "aardvark",
        name: "Aardvark",
        reviewCount: 2,
        averageRating: 4.5,
      }),
    ].toSorted(comparePublicVenueSort);

    expect(sorted.map((venue) => venue.id)).toEqual([
      "beta",
      "aardvark",
      "alpha",
    ]);
  });
});
