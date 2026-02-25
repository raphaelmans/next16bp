/**
 * Pure transformation functions for the bookingCartMachine.
 * The machine file wraps them in assign().
 */

import { getAddItemValidationError } from "./booking-cart-machine.guards";
import type {
  BookingCartContext,
  BookingCartItem,
} from "./booking-cart-machine.types";

export function computeAddItem(
  items: BookingCartItem[],
  newItem: BookingCartItem,
): BookingCartItem[] {
  return [...items, newItem];
}

export function computeRemoveItem(
  items: BookingCartItem[],
  key: string,
): BookingCartItem[] {
  return items.filter((i) => i.key !== key);
}

export function computeSportFilter(
  items: BookingCartItem[],
  sportId: string,
): BookingCartItem[] {
  return items.filter((i) => i.sportId === sportId);
}

export function computeValidationError(
  context: BookingCartContext,
  event: { type: "ADD_ITEM"; item: BookingCartItem },
): string | null {
  return getAddItemValidationError({ context, event });
}
