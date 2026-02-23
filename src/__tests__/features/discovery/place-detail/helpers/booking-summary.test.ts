import { describe, expect, it } from "vitest";
import type { TimeSlot } from "@/components/kudos";
import { buildBookingSelectionSummary } from "@/features/discovery/place-detail/helpers/booking-summary";

const makeSlot = (value: Partial<TimeSlot>): TimeSlot =>
  ({
    id: "slot-1",
    startTime: "2026-02-26T03:00:00.000Z",
    endTime: "2026-02-26T04:00:00.000Z",
    status: "available",
    currency: "PHP",
    ...value,
  }) as TimeSlot;

describe("buildBookingSelectionSummary", () => {
  it("returns null when there is no selected start time", () => {
    const summary = buildBookingSelectionSummary({
      selectedStartTime: undefined,
      pickerSlots: [makeSlot({})],
      pricingOptions: [],
    });

    expect(summary).toBeNull();
  });

  it("returns null when selected start time does not exist in picker slots", () => {
    const summary = buildBookingSelectionSummary({
      selectedStartTime: "2026-02-26T05:00:00.000Z",
      pickerSlots: [makeSlot({})],
      pricingOptions: [],
    });

    expect(summary).toBeNull();
  });

  it("uses duration-level pricing option so flat add-ons are not multiplied per hour", () => {
    const pickerSlots: TimeSlot[] = [
      makeSlot({
        id: "s1",
        startTime: "2026-02-26T03:00:00.000Z",
        endTime: "2026-02-26T04:00:00.000Z",
        priceCents: 65000,
      }),
      makeSlot({
        id: "s2",
        startTime: "2026-02-26T04:00:00.000Z",
        endTime: "2026-02-26T05:00:00.000Z",
        priceCents: 65000,
      }),
      makeSlot({
        id: "s3",
        startTime: "2026-02-26T05:00:00.000Z",
        endTime: "2026-02-26T06:00:00.000Z",
        priceCents: 65000,
      }),
    ];

    const summary = buildBookingSelectionSummary({
      selectedStartTime: "2026-02-26T03:00:00.000Z",
      pickerSlots,
      pricingOptions: [
        {
          startTime: "2026-02-26T03:00:00.000Z",
          endTime: "2026-02-26T06:00:00.000Z",
          totalPriceCents: 210000,
          currency: "PHP",
        },
      ],
    });

    expect(summary).toEqual({
      startTime: "2026-02-26T03:00:00.000Z",
      endTime: "2026-02-26T06:00:00.000Z",
      totalCents: 210000,
      currency: "PHP",
    });
  });

  it("falls back to picker end time and currency when summary pricing is unavailable", () => {
    const summary = buildBookingSelectionSummary({
      selectedStartTime: "2026-02-26T03:00:00.000Z",
      pickerSlots: [
        makeSlot({
          startTime: "2026-02-26T03:00:00.000Z",
          endTime: "2026-02-26T04:00:00.000Z",
          currency: "USD",
        }),
      ],
      pricingOptions: [],
    });

    expect(summary).toEqual({
      startTime: "2026-02-26T03:00:00.000Z",
      endTime: "2026-02-26T04:00:00.000Z",
      totalCents: undefined,
      currency: "USD",
    });
  });
});
