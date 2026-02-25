import { describe, expect, it } from "vitest";
import { getPlaceVerificationDisplay } from "@/features/discovery/helpers";

describe("getPlaceVerificationDisplay", () => {
  it("hides booking and shows payment method messaging when payment methods are missing", () => {
    const result = getPlaceVerificationDisplay({
      placeType: "RESERVABLE",
      verificationStatus: "VERIFIED",
      reservationsEnabled: true,
      hasPaymentMethods: false,
    });

    expect(result.showBooking).toBe(false);
    expect(result.verificationMessage).toBe("Payment method required");
    expect(result.verificationStatusVariant).toBe("warning");
  });

  it("shows booking when all reservation requirements are satisfied", () => {
    const result = getPlaceVerificationDisplay({
      placeType: "RESERVABLE",
      verificationStatus: "VERIFIED",
      reservationsEnabled: true,
      hasPaymentMethods: true,
    });

    expect(result.showBooking).toBe(true);
    expect(result.verificationMessage).toBe("Verified for reservations");
  });

  it("prioritizes verification status messaging ahead of payment messaging", () => {
    const result = getPlaceVerificationDisplay({
      placeType: "RESERVABLE",
      verificationStatus: "PENDING",
      reservationsEnabled: true,
      hasPaymentMethods: false,
    });

    expect(result.showBooking).toBe(false);
    expect(result.verificationMessage).toBe("Verification pending");
    expect(result.verificationStatusVariant).toBe("warning");
  });
});
