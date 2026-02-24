import {
  isBookingCartKeyDuplicate,
  validateBookingCartAdd,
} from "../helpers/booking-cart-rules";
import type {
  BookingCartContext,
  BookingCartEvent,
} from "./booking-cart-machine.types";

type GuardArgs = {
  context: BookingCartContext;
  event: BookingCartEvent;
};

export function canAddItem({ context, event }: GuardArgs): boolean {
  if (event.type !== "ADD_ITEM") return false;
  if (context.items.length >= context.maxItems) return false;

  if (
    isBookingCartKeyDuplicate({ cartItems: context.items, key: event.item.key })
  ) {
    return false;
  }

  const validation = validateBookingCartAdd({
    cartItems: context.items,
    candidate: {
      courtId: event.item.courtId,
      startTime: event.item.startTime,
    },
    placeTimeZone: context.placeTimeZone,
  });

  return validation.ok;
}

export function getAddItemValidationError({
  context,
  event,
}: GuardArgs): string | null {
  if (event.type !== "ADD_ITEM") return null;
  if (context.items.length >= context.maxItems) return "MAX_REACHED";

  if (
    isBookingCartKeyDuplicate({ cartItems: context.items, key: event.item.key })
  ) {
    return "DUPLICATE_KEY";
  }

  const validation = validateBookingCartAdd({
    cartItems: context.items,
    candidate: {
      courtId: event.item.courtId,
      startTime: event.item.startTime,
    },
    placeTimeZone: context.placeTimeZone,
  });

  if (!validation.ok) return validation.reason;
  return null;
}

export function willBeEmptyAfterRemove({ context, event }: GuardArgs): boolean {
  if (event.type !== "REMOVE_ITEM") return false;
  return context.items.filter((i) => i.key !== event.key).length === 0;
}

export function willBeEmptyAfterSportChange({
  context,
  event,
}: GuardArgs): boolean {
  if (event.type !== "SPORT_CHANGED") return false;
  return context.items.filter((i) => i.sportId === event.sportId).length === 0;
}

export function hasItems({ context }: GuardArgs): boolean {
  return context.items.length > 0;
}
