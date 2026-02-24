import type { BookingCartItem } from "../stores/booking-cart-store";

type BuildCartItemInput = {
  courtId: string;
  courtLabel: string;
  sportId: string;
  startTime: string;
  durationMinutes: number;
  estimatedPriceCents: number | null;
  currency: string;
};

export function buildCartItemKey(
  courtId: string,
  startTime: string,
  durationMinutes: number,
): string {
  return `${courtId}|${startTime}|${durationMinutes}`;
}

export function buildCartItemFromSelection(
  input: BuildCartItemInput,
): BookingCartItem {
  return {
    key: buildCartItemKey(
      input.courtId,
      input.startTime,
      input.durationMinutes,
    ),
    courtId: input.courtId,
    courtLabel: input.courtLabel,
    sportId: input.sportId,
    startTime: input.startTime,
    durationMinutes: input.durationMinutes,
    estimatedPriceCents: input.estimatedPriceCents,
    currency: input.currency,
  };
}
