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

export function buildBookingSelectionSummary(options: {
  selectedStartTime?: string;
  pickerSlots: TimeSlot[];
  pricingOptions: BookingSummaryPricingOption[];
}): BookingSelectionSummary | null {
  const { selectedStartTime, pickerSlots, pricingOptions } = options;
  if (!selectedStartTime) return null;

  const pickerSlot = pickerSlots.find(
    (slot) => slot.startTime === selectedStartTime,
  );
  if (!pickerSlot) return null;

  const pricingOption = pricingOptions.find(
    (option) => option.startTime === selectedStartTime,
  );

  return {
    startTime: selectedStartTime,
    endTime: pricingOption?.endTime ?? pickerSlot.endTime,
    totalCents: pricingOption?.totalPriceCents,
    currency: pricingOption?.currency ?? pickerSlot.currency ?? "PHP",
  };
}
