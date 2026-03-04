import { addMinutes } from "date-fns";
import { getZonedDayKey } from "@/common/time-zone";

type BookingCartRuleItem = {
  courtId: string;
  startTime: string;
  durationMinutes: number;
};

type BookingCartKeyItem = {
  key: string;
};

export type BookingCartRuleViolation = "DIFFERENT_DAY" | "DUPLICATE_COURT";

export type BookingCartRuleValidationResult =
  | { ok: true }
  | { ok: false; reason: BookingCartRuleViolation };

type ValidateAddToCartInput = {
  cartItems: BookingCartRuleItem[];
  candidate: BookingCartRuleItem;
  placeTimeZone: string;
};

type IsBookingCartKeyDuplicateInput = {
  cartItems: BookingCartKeyItem[];
  key: string;
};

export const getBookingCartDayKey = (
  startTimeIso: string,
  placeTimeZone: string,
): string => getZonedDayKey(startTimeIso, placeTimeZone);

/**
 * Returns the set of dayKeys that a booking item spans.
 * A same-day booking returns 1 key; a cross-midnight booking returns 2.
 */
export function getBookingCartDayKeys(
  item: BookingCartRuleItem,
  placeTimeZone: string,
): Set<string> {
  const startKey = getZonedDayKey(item.startTime, placeTimeZone);
  const endTime = addMinutes(new Date(item.startTime), item.durationMinutes);
  const endKey = getZonedDayKey(endTime, placeTimeZone);
  const keys = new Set<string>();
  keys.add(startKey);
  keys.add(endKey);
  return keys;
}

export function isBookingCartKeyDuplicate({
  cartItems,
  key,
}: IsBookingCartKeyDuplicateInput): boolean {
  return cartItems.some((item) => item.key === key);
}

export function getBookingCartViolationMessage(
  reason: BookingCartRuleViolation,
): string {
  switch (reason) {
    case "DIFFERENT_DAY":
      return "Your booking already has courts for another day. Clear your cart to start a new booking.";
    case "DUPLICATE_COURT":
      return "You can only add one time span per court in this booking.";
  }
}

export function validateBookingCartAdd({
  cartItems,
  candidate,
  placeTimeZone,
}: ValidateAddToCartInput): BookingCartRuleValidationResult {
  if (cartItems.length === 0) {
    return { ok: true };
  }

  const firstItem = cartItems[0];
  const referenceDayKeys = firstItem
    ? getBookingCartDayKeys(firstItem, placeTimeZone)
    : new Set<string>();
  const candidateDayKey = getBookingCartDayKey(
    candidate.startTime,
    placeTimeZone,
  );

  if (!referenceDayKeys.has(candidateDayKey)) {
    return { ok: false, reason: "DIFFERENT_DAY" };
  }

  if (cartItems.some((item) => item.courtId === candidate.courtId)) {
    return { ok: false, reason: "DUPLICATE_COURT" };
  }

  return { ok: true };
}
