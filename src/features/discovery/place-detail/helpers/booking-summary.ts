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
  pickerSlots: TimeSlot[];
  pricingOptions: BookingSummaryPricingOption[];
}): BookingSelectionSummary | null {
  const { selectedStartTime, pickerSlots, pricingOptions } = options;
  if (!selectedStartTime) return null;

  const pickerSlot = pickerSlots.find((slot) =>
    isSameInstant(slot.startTime, selectedStartTime),
  );
  if (!pickerSlot) return null;

  const pricingOption = pricingOptions.find((option) =>
    isSameInstant(option.startTime, selectedStartTime),
  );

  return {
    startTime: selectedStartTime,
    endTime: pricingOption?.endTime ?? pickerSlot.endTime,
    totalCents: pricingOption?.totalPriceCents,
    currency: pricingOption?.currency ?? pickerSlot.currency ?? "PHP",
  };
}
