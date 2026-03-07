import { describe, expect, it } from "vitest";
import { getReservationEnablement } from "@/common/reservation-enablement";

describe("getReservationEnablement", () => {
  it("blocks public booking when payment methods are missing", () => {
    const result = getReservationEnablement({
      placeType: "RESERVABLE",
      verificationStatus: "VERIFIED",
      reservationsEnabled: true,
      hasPaymentMethods: false,
    });

    expect(result.canShowPublicBooking).toBe(false);
    expect(result.issues).toContainEqual({
      code: "NO_PAYMENT_METHOD",
      tone: "warning",
    });
  });

  it("keeps public booking enabled when payment methods are present", () => {
    const result = getReservationEnablement({
      placeType: "RESERVABLE",
      verificationStatus: "VERIFIED",
      reservationsEnabled: true,
      hasPaymentMethods: true,
    });

    expect(result.canShowPublicBooking).toBe(true);
    expect(
      result.issues.some((issue) => issue.code === "NO_PAYMENT_METHOD"),
    ).toBe(false);
  });

  it("preserves backward compatibility when payment method input is omitted", () => {
    const result = getReservationEnablement({
      placeType: "RESERVABLE",
      verificationStatus: "VERIFIED",
      reservationsEnabled: true,
    });

    expect(result.canShowPublicBooking).toBe(true);
  });

  it("keeps public booking enabled for pending venues when reservations are enabled", () => {
    const result = getReservationEnablement({
      placeType: "RESERVABLE",
      verificationStatus: "PENDING",
      reservationsEnabled: true,
      hasPaymentMethods: true,
    });

    expect(result.canShowPublicBooking).toBe(true);
    expect(result.issues).toContainEqual({
      code: "VERIFICATION_PENDING",
      tone: "warning",
    });
  });

  it("keeps public booking enabled for rejected venues when reservations are enabled", () => {
    const result = getReservationEnablement({
      placeType: "RESERVABLE",
      verificationStatus: "REJECTED",
      reservationsEnabled: true,
      hasPaymentMethods: true,
    });

    expect(result.canShowPublicBooking).toBe(true);
    expect(result.issues).toContainEqual({
      code: "VERIFICATION_REJECTED",
      tone: "destructive",
    });
  });
});
