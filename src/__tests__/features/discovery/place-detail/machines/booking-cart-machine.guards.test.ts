import { describe, expect, it } from "vitest";
import {
  canAddItem,
  getAddItemValidationError,
} from "@/features/discovery/place-detail/machines/booking-cart-machine.guards";
import type {
  BookingCartContext,
  BookingCartEvent,
  BookingCartItem,
} from "@/features/discovery/place-detail/machines/booking-cart-machine.types";

function makeItem(overrides: Partial<BookingCartItem>): BookingCartItem {
  return {
    key: "court-a|2026-03-21T13:00:00.000Z|300",
    courtId: "court-a",
    courtLabel: "Court A",
    sportId: "sport-1",
    startTime: "2026-03-21T13:00:00.000Z",
    durationMinutes: 300,
    estimatedPriceCents: 250000,
    currency: "PHP",
    ...overrides,
  };
}

function makeContext(items: BookingCartItem[]): BookingCartContext {
  return {
    items,
    maxItems: 12,
    placeTimeZone: "Asia/Manila",
    lastValidationError: null,
  };
}

function makeAddEvent(item: BookingCartItem): BookingCartEvent {
  return { type: "ADD_ITEM", item };
}

describe("booking-cart-machine guards", () => {
  it("canAddItem allows candidate that touches first cart item's cross-midnight day window", () => {
    const context = makeContext([
      makeItem({
        // Mar 21 9:00 PM PHT -> Mar 22 2:00 AM PHT
        key: "court-a|2026-03-21T13:00:00.000Z|300",
        courtId: "court-a",
        startTime: "2026-03-21T13:00:00.000Z",
        durationMinutes: 300,
      }),
    ]);

    const event = makeAddEvent(
      makeItem({
        key: "court-b|2026-03-22T02:00:00.000Z|60",
        courtId: "court-b",
        courtLabel: "Court B",
        // Mar 22 10:00 AM PHT
        startTime: "2026-03-22T02:00:00.000Z",
        durationMinutes: 60,
      }),
    );

    expect(canAddItem({ context, event })).toBe(true);
  });

  it("getAddItemValidationError returns DIFFERENT_DAY when candidate does not touch anchor day window", () => {
    const context = makeContext([
      makeItem({
        // Mar 21 9:00 PM PHT -> Mar 22 2:00 AM PHT
        key: "court-a|2026-03-21T13:00:00.000Z|300",
        courtId: "court-a",
        startTime: "2026-03-21T13:00:00.000Z",
        durationMinutes: 300,
      }),
    ]);

    const event = makeAddEvent(
      makeItem({
        key: "court-b|2026-03-23T13:00:00.000Z|120",
        courtId: "court-b",
        courtLabel: "Court B",
        // Mar 23 9:00 PM PHT
        startTime: "2026-03-23T13:00:00.000Z",
        durationMinutes: 120,
      }),
    );

    expect(getAddItemValidationError({ context, event })).toBe("DIFFERENT_DAY");
  });
});
