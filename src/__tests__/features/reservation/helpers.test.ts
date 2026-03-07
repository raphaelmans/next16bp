import { describe, expect, it } from "vitest";
import {
  canShowReservationPaymentStep,
  getReservationPageDisplayStep,
} from "@/features/reservation/helpers";

describe("reservation page step helpers", () => {
  it("shows payment for single reservations awaiting payment", () => {
    expect(
      canShowReservationPaymentStep({
        status: "AWAITING_PAYMENT",
        isGroupReservation: false,
        hasPayableAwaitingItems: false,
      }),
    ).toBe(true);
  });

  it("requires payable linked items before showing group payment", () => {
    expect(
      canShowReservationPaymentStep({
        status: "AWAITING_PAYMENT",
        isGroupReservation: true,
        hasPayableAwaitingItems: false,
      }),
    ).toBe(false);
    expect(
      canShowReservationPaymentStep({
        status: "AWAITING_PAYMENT",
        isGroupReservation: true,
        hasPayableAwaitingItems: true,
      }),
    ).toBe(true);
  });

  it("normalizes invalid payment steps back to overview", () => {
    expect(
      getReservationPageDisplayStep({
        requestedStep: "payment",
        status: "PAYMENT_MARKED_BY_USER",
        isGroupReservation: false,
        hasPayableAwaitingItems: false,
      }),
    ).toBe("overview");
  });

  it("keeps the overview step when no explicit payment step is requested", () => {
    expect(
      getReservationPageDisplayStep({
        requestedStep: null,
        status: "AWAITING_PAYMENT",
        isGroupReservation: false,
        hasPayableAwaitingItems: false,
      }),
    ).toBe("overview");
  });
});
