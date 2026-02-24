import { describe, expect, it } from "vitest";
import {
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
        },
      ],
      candidate: {
        courtId: "court-b",
        startTime: "2026-02-24T09:00:00.000Z",
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
        },
      ],
      candidate: {
        courtId: "court-b",
        // 2026-02-25 00:30 Asia/Manila
        startTime: "2026-02-24T16:30:00.000Z",
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
        },
      ],
      candidate: {
        courtId: "court-a",
        startTime: "2026-02-24T09:00:00.000Z",
      },
      placeTimeZone: "Asia/Manila",
    });

    expect(result).toEqual({ ok: false, reason: "DUPLICATE_COURT" });
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
