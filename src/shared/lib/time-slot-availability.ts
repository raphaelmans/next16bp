import type { TimeSlotRecord } from "@/shared/infra/db/schema";

interface SlotSequenceOptions {
  slotMap: Map<number, TimeSlotRecord>;
  startSlot: TimeSlotRecord;
  durationMinutes: number;
}

interface SlotPricingSummary {
  totalPriceCents: number;
  currency: string | null;
}

export function buildSlotStartMap(
  slots: TimeSlotRecord[],
): Map<number, TimeSlotRecord> {
  return new Map(slots.map((slot) => [slot.startTime.getTime(), slot]));
}

export function collectConsecutiveSlots(
  options: SlotSequenceOptions,
): TimeSlotRecord[] | null {
  const durationMs = options.durationMinutes * 60000;
  const slots: TimeSlotRecord[] = [];
  let totalMs = 0;
  let currentSlot: TimeSlotRecord | undefined = options.startSlot;

  while (currentSlot && totalMs < durationMs) {
    const slotDurationMs =
      currentSlot.endTime.getTime() - currentSlot.startTime.getTime();
    if (slotDurationMs <= 0) {
      return null;
    }

    slots.push(currentSlot);
    totalMs += slotDurationMs;

    if (totalMs >= durationMs) {
      break;
    }

    currentSlot = options.slotMap.get(currentSlot.endTime.getTime());
  }

  return totalMs >= durationMs ? slots : null;
}

export function findConsecutiveSlots(options: {
  slots: TimeSlotRecord[];
  startTime: Date;
  durationMinutes: number;
}): TimeSlotRecord[] | null {
  const slotMap = buildSlotStartMap(options.slots);
  const startSlot = slotMap.get(options.startTime.getTime());
  if (!startSlot) {
    return null;
  }

  return collectConsecutiveSlots({
    slotMap,
    startSlot,
    durationMinutes: options.durationMinutes,
  });
}

export function summarizeSlotPricing(
  slots: TimeSlotRecord[],
): SlotPricingSummary {
  let totalPriceCents = 0;
  let currency: string | null = null;
  let currencyMismatch = false;

  for (const slot of slots) {
    totalPriceCents += slot.priceCents ?? 0;

    if (slot.currency) {
      if (currency && currency !== slot.currency) {
        currencyMismatch = true;
      } else if (!currency) {
        currency = slot.currency;
      }
    }
  }

  return {
    totalPriceCents,
    currency: currencyMismatch ? null : currency,
  };
}
