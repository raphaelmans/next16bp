import { describe, expect, it } from "vitest";
import {
  getBookingCartViolationMessage,
  isBookingCartKeyDuplicate,
  validateBookingCartAdd,
} from "@/features/discovery/place-detail/helpers/booking-cart-rules";

describe("validateBookingCartAdd", () => {
  it("allows add when cart is empty", () => {
    const result = validateBookingCartAdd({
      cartItems: [],
      candidate: {
        courtId: "court-a",
        startTime: "2026-02-24T01:00:00.000Z",
        durationMinutes: 60,
      },
      placeTimeZone: "Asia/Manila",
    });

    expect(result).toEqual({ ok: true });
  });

  it("allows different courts on the same place-timezone day", () => {
    const result = validateBookingCartAdd({
      cartItems: [
        {
          courtId: "court-a",
          startTime: "2026-02-24T01:00:00.000Z",
          durationMinutes: 60,
        },
      ],
      candidate: {
        courtId: "court-b",
        startTime: "2026-02-24T09:00:00.000Z",
        durationMinutes: 60,
      },
      placeTimeZone: "Asia/Manila",
    });

    expect(result).toEqual({ ok: true });
  });

  it("rejects if candidate is on a different place-timezone day", () => {
    const result = validateBookingCartAdd({
      cartItems: [
        {
          courtId: "court-a",
          // 2026-02-24 23:30 Asia/Manila
          startTime: "2026-02-24T15:30:00.000Z",
          durationMinutes: 60,
        },
      ],
      candidate: {
        courtId: "court-b",
        // 2026-02-25 00:30 Asia/Manila
        startTime: "2026-02-24T16:30:00.000Z",
        durationMinutes: 60,
      },
      placeTimeZone: "Asia/Manila",
    });

    expect(result).toEqual({ ok: false, reason: "DIFFERENT_DAY" });
  });

  it("rejects second item for the same court on the same day", () => {
    const result = validateBookingCartAdd({
      cartItems: [
        {
          courtId: "court-a",
          startTime: "2026-02-24T01:00:00.000Z",
          durationMinutes: 60,
        },
      ],
      candidate: {
        courtId: "court-a",
        startTime: "2026-02-24T09:00:00.000Z",
        durationMinutes: 60,
      },
      placeTimeZone: "Asia/Manila",
    });

    expect(result).toEqual({ ok: false, reason: "DUPLICATE_COURT" });
  });
});

describe("getBookingCartViolationMessage", () => {
  it("returns clear-cart message for DIFFERENT_DAY", () => {
    expect(getBookingCartViolationMessage("DIFFERENT_DAY")).toBe(
      "Your booking already has courts for another day. Clear your cart to start a new booking.",
    );
  });

  it("returns duplicate court message for DUPLICATE_COURT", () => {
    expect(getBookingCartViolationMessage("DUPLICATE_COURT")).toBe(
      "You can only add one time span per court in this booking.",
    );
  });
});

describe("isBookingCartKeyDuplicate", () => {
  it("returns true when key already exists in cart", () => {
    const result = isBookingCartKeyDuplicate({
      cartItems: [
        {
          key: "court-a|2026-02-24T01:00:00.000Z|60",
        },
      ],
      key: "court-a|2026-02-24T01:00:00.000Z|60",
    });

    expect(result).toBe(true);
  });

  it("returns false when key does not exist in cart", () => {
    const result = isBookingCartKeyDuplicate({
      cartItems: [
        {
          key: "court-a|2026-02-24T01:00:00.000Z|60",
        },
      ],
      key: "court-b|2026-02-24T01:00:00.000Z|60",
    });

    expect(result).toBe(false);
  });
});
