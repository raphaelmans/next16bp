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

  // Cross-day fallback: compute endTime from startTime + durationMinutes
  const fallbackEndTime = durationMinutes
    ? new Date(
        Date.parse(selectedStartTime) + durationMinutes * 60_000,
      ).toISOString()
    : undefined;

  const endTime =
    pricingOption?.endTime ?? pickerSlot?.endTime ?? fallbackEndTime;
  if (!endTime) return null;

  return {
    startTime: selectedStartTime,
    endTime,
    totalCents: pricingOption?.totalPriceCents,
    currency: pricingOption?.currency ?? pickerSlot?.currency ?? "PHP",
  };
}
