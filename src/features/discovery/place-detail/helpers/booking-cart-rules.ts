import { getZonedDayKey } from "@/common/time-zone";

type BookingCartRuleItem = {
  courtId: string;
  startTime: string;
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

export function isBookingCartKeyDuplicate({
  cartItems,
  key,
}: IsBookingCartKeyDuplicateInput): boolean {
  return cartItems.some((item) => item.key === key);
}

export function validateBookingCartAdd({
  cartItems,
  candidate,
  placeTimeZone,
}: ValidateAddToCartInput): BookingCartRuleValidationResult {
  if (cartItems.length === 0) {
    return { ok: true };
  }

  const referenceDayKey = getBookingCartDayKey(
    cartItems[0]?.startTime ?? candidate.startTime,
    placeTimeZone,
  );
  const candidateDayKey = getBookingCartDayKey(
    candidate.startTime,
    placeTimeZone,
  );

  if (referenceDayKey !== candidateDayKey) {
    return { ok: false, reason: "DIFFERENT_DAY" };
  }

  if (cartItems.some((item) => item.courtId === candidate.courtId)) {
    return { ok: false, reason: "DUPLICATE_COURT" };
  }

  return { ok: true };
}
