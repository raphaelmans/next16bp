import { describe, expect, it } from "vitest";
import { deriveSetupStatus } from "@/features/owner/components/get-started/get-started-helpers";

describe("deriveSetupStatus", () => {
  it("returns all-false defaults for undefined input", () => {
    const result = deriveSetupStatus(undefined);

    expect(result.organization).toBeNull();
    expect(result.organizationId).toBeUndefined();
    expect(result.primaryPlaceId).toBeUndefined();
    expect(result.primaryPlaceName).toBe("your venue");
    expect(result.verificationStatus).toBeNull();
    expect(result.isVenueVerified).toBe(false);
    expect(result.hasOrganization).toBe(false);
    expect(result.hasPendingClaim).toBe(false);
    expect(result.hasVenue).toBe(false);
    expect(result.hasVerification).toBe(false);
    expect(result.hasActiveCourt).toBe(false);
    expect(result.hasReadyCourt).toBe(false);
    expect(result.hasCourtSchedule).toBe(false);
    expect(result.hasCourtPricing).toBe(false);
    expect(result.hasPaymentMethod).toBe(false);
    expect(result.primaryCourtId).toBeUndefined();
    expect(result.readyCourtId).toBeUndefined();
    expect(result.isSetupComplete).toBe(false);
  });

  it("extracts organization when present", () => {
    const org = { id: "org-1", name: "Test Org" };
    const result = deriveSetupStatus({
      organization: org,
      hasOrganization: true,
    });

    expect(result.organization).toEqual(org);
    expect(result.organizationId).toBe("org-1");
    expect(result.hasOrganization).toBe(true);
  });

  it("extracts primary place info when present", () => {
    const result = deriveSetupStatus({
      primaryPlace: { id: "place-1", name: "Main Court" },
      hasVenue: true,
    });

    expect(result.primaryPlaceId).toBe("place-1");
    expect(result.primaryPlaceName).toBe("Main Court");
    expect(result.hasVenue).toBe(true);
  });

  it("falls back to 'your venue' when primaryPlace is null", () => {
    const result = deriveSetupStatus({ primaryPlace: null });

    expect(result.primaryPlaceName).toBe("your venue");
    expect(result.primaryPlaceId).toBeUndefined();
  });

  it("derives isVenueVerified from verificationStatus", () => {
    const cases: Array<{
      label: string;
      input: string | null;
      expected: boolean;
    }> = [
      { label: "VERIFIED", input: "VERIFIED", expected: true },
      { label: "PENDING", input: "PENDING", expected: false },
      { label: "REJECTED", input: "REJECTED", expected: false },
      { label: "null", input: null, expected: false },
    ];

    for (const { label, input, expected } of cases) {
      const result = deriveSetupStatus({ verificationStatus: input });
      expect(result.isVenueVerified, label).toBe(expected);
    }
  });

  it("maps all boolean fields from raw response", () => {
    const result = deriveSetupStatus({
      hasOrganization: true,
      hasPendingClaim: true,
      hasVenue: true,
      hasVerification: true,
      hasActiveCourt: true,
      hasReadyCourt: true,
      hasCourtSchedule: true,
      hasCourtPricing: true,
      hasPaymentMethod: true,
      isSetupComplete: true,
    });

    expect(result.hasOrganization).toBe(true);
    expect(result.hasPendingClaim).toBe(true);
    expect(result.hasVenue).toBe(true);
    expect(result.hasVerification).toBe(true);
    expect(result.hasActiveCourt).toBe(true);
    expect(result.hasReadyCourt).toBe(true);
    expect(result.hasCourtSchedule).toBe(true);
    expect(result.hasCourtPricing).toBe(true);
    expect(result.hasPaymentMethod).toBe(true);
    expect(result.isSetupComplete).toBe(true);
  });

  it("converts null court IDs to undefined", () => {
    const result = deriveSetupStatus({
      primaryCourtId: null,
      readyCourtId: null,
    });

    expect(result.primaryCourtId).toBeUndefined();
    expect(result.readyCourtId).toBeUndefined();
  });

  it("passes through court IDs when present", () => {
    const result = deriveSetupStatus({
      primaryCourtId: "court-1",
      readyCourtId: "court-2",
    });

    expect(result.primaryCourtId).toBe("court-1");
    expect(result.readyCourtId).toBe("court-2");
  });

  it("handles partial data gracefully", () => {
    const result = deriveSetupStatus({
      hasOrganization: true,
      // everything else missing
    });

    expect(result.hasOrganization).toBe(true);
    expect(result.hasVenue).toBe(false);
    expect(result.organization).toBeNull();
    expect(result.isSetupComplete).toBe(false);
  });
});
