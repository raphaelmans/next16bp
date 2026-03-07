import { describe, expect, it } from "vitest";
import {
  getPlayerReservationAbsoluteUrl,
  getPlayerReservationLoginRedirectPath,
  getPlayerReservationPath,
  getPlayerReservationPaymentPath,
  parsePlayerReservationStep,
} from "@/common/reservation-links";

describe("reservation links", () => {
  it("routes awaiting payment reservations to the payment page", () => {
    expect(
      getPlayerReservationPath({
        reservationId: "res-1",
        status: "AWAITING_PAYMENT",
      }),
    ).toBe("/reservations/res-1?step=payment");
  });

  it("routes non-awaiting statuses to reservation detail", () => {
    expect(
      getPlayerReservationPath({ reservationId: "res-1", status: "CREATED" }),
    ).toBe("/reservations/res-1");
    expect(
      getPlayerReservationPath({ reservationId: "res-1", status: "CONFIRMED" }),
    ).toBe("/reservations/res-1");
    expect(
      getPlayerReservationPath({ reservationId: "res-1", status: "CANCELLED" }),
    ).toBe("/reservations/res-1");
  });

  it("builds absolute urls", () => {
    expect(
      getPlayerReservationAbsoluteUrl({
        reservationId: "res-1",
        status: "AWAITING_PAYMENT",
        origin: "https://kudoscourts.com",
      }),
    ).toBe("https://kudoscourts.com/reservations/res-1?step=payment");
  });

  it("builds login redirect urls using the status-aware route", () => {
    expect(
      getPlayerReservationLoginRedirectPath({
        reservationId: "res-1",
        status: "AWAITING_PAYMENT",
      }),
    ).toBe("/login?redirect=%2Freservations%2Fres-1%3Fstep%3Dpayment");
  });

  it("builds explicit payment paths on the canonical route", () => {
    expect(getPlayerReservationPaymentPath("res-1")).toBe(
      "/reservations/res-1?step=payment",
    );
  });

  it("parses the only supported player reservation step", () => {
    expect(parsePlayerReservationStep("payment")).toBe("payment");
    expect(parsePlayerReservationStep("overview")).toBeUndefined();
    expect(parsePlayerReservationStep(undefined)).toBeUndefined();
  });
});
