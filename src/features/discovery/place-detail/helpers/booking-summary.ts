import type { TimeSlot } from "@/components/kudos";

export type BookingSummaryPricingOption = {
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency?: string | null;
};

export type BookingSelectionSummary = {
  startTime: string;
  endTime: string;
  totalCents?: number;
  currency: string;
};

const SLOT_DURATION_MINUTES = 60;
const SLOT_DURATION_MS = SLOT_DURATION_MINUTES * 60_000;

const isSameInstant = (a: string, b: string): boolean => {
  const aMs = Date.parse(a);
  const bMs = Date.parse(b);
  if (Number.isFinite(aMs) && Number.isFinite(bMs)) {
    return aMs === bMs;
  }
  return a === b;
};

export function buildBookingSelectionSummary(options: {
  selectedStartTime?: string;
  durationMinutes?: number;
  pickerSlots: TimeSlot[];
  pricingOptions: BookingSummaryPricingOption[];
}): BookingSelectionSummary | null {
  const { selectedStartTime, durationMinutes, pickerSlots, pricingOptions } =
    options;
  if (!selectedStartTime) return null;

  const pricingOption = pricingOptions.find((option) =>
    isSameInstant(option.startTime, selectedStartTime),
  );

  const pickerSlot = pickerSlots.find((slot) =>
    isSameInstant(slot.startTime, selectedStartTime),
  );

  // Fast local estimate: derive total from contiguous picker slots while
  // duration-level pricing query is still in flight.
  let localTotalCents: number | undefined;
  if (!pricingOption && durationMinutes && durationMinutes > 0) {
    const slotCount = Math.floor(durationMinutes / SLOT_DURATION_MINUTES);
    if (slotCount > 0) {
      const lookup = new Map<number, TimeSlot>();
      for (const slot of pickerSlots) {
        lookup.set(Date.parse(slot.startTime), slot);
      }

      const startMs = Date.parse(selectedStartTime);
      if (Number.isFinite(startMs)) {
        let total = 0;
        let complete = true;
        for (let i = 0; i < slotCount; i++) {
          const slot = lookup.get(startMs + i * SLOT_DURATION_MS);
          if (!slot || typeof slot.priceCents !== "number") {
            complete = false;
            break;
          }
          total += slot.priceCents;
        }
        if (complete) {
          localTotalCents = total;
        }
      }
    }
  }

  // Cross-day fallback: compute endTime from startTime + durationMinutes
  const fallbackEndTime = durationMinutes
    ? new Date(
        Date.parse(selectedStartTime) + durationMinutes * 60_000,
      ).toISOString()
    : undefined;

  const endTime =
    pricingOption?.endTime ?? fallbackEndTime ?? pickerSlot?.endTime;
  if (!endTime) return null;

  return {
    startTime: selectedStartTime,
    endTime,
    totalCents: pricingOption?.totalPriceCents ?? localTotalCents,
    currency: pricingOption?.currency ?? pickerSlot?.currency ?? "PHP",
  };
}
