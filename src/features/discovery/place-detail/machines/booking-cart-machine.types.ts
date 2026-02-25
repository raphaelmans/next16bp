import type { BookingCartItem } from "../stores/booking-cart-store";

export type BookingCartContext = {
  items: BookingCartItem[];
  maxItems: number;
  placeTimeZone: string;
  lastValidationError: string | null;
};

export type BookingCartInput = {
  maxItems?: number;
  placeTimeZone: string;
};

export type BookingCartEvent =
  | { type: "ADD_ITEM"; item: BookingCartItem }
  | { type: "REMOVE_ITEM"; key: string }
  | { type: "CLEAR_CART" }
  | { type: "SPORT_CHANGED"; sportId: string }
  | { type: "REQUEST_CHECKOUT" }
  | { type: "CANCEL_CHECKOUT" };

export type { BookingCartItem };
