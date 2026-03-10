import { describe, expect, it } from "vitest";
import {
  buildBaselineFlags,
  deriveDeterministicSuggestion,
  summarizeReport,
  toListingEvidence,
  toTrackingBucket,
} from "@/lib/modules/automations/listing-verifier/shared/place-listing-verifier.domain";

describe("place listing verifier domain", () => {
  it("maps place types into tracking buckets", () => {
    expect(toTrackingBucket("CURATED")).toBe("curated_place");
    expect(toTrackingBucket("RESERVABLE")).toBe("org_created_place");
  });

  it("derives non-production and trust flags from evidence", () => {
    const flags = buildBaselineFlags({
      placeId: "11111111-1111-1111-1111-111111111111",
      trackingBucket: "curated_place",
      placeType: "CURATED",
      organizationId: null,
      slug: "test-clubs",
      name: "Test Clubs",
      address: "123 Sample Street",
      city: "CEBU CITY",
      province: "CEBU",
      country: "PH",
      claimStatus: "UNCLAIMED",
      verificationStatus: "NONE",
      activeCourtCount: 1,
      activeCourtLabels: ["Court 1"],
      activeSports: ["pickleball"],
      photoCount: 0,
      hasContactDetails: false,
    });

    expect(flags).toEqual(["missing_trust_signal", "nonprod_slug"]);
  });

  it("turns baseline flags into deterministic triage", () => {
    expect(
      deriveDeterministicSuggestion(["nonprod_slug", "missing_trust_signal"]),
    ).toEqual({
      label: "remove",
      reasonCode: "nonprod_or_test",
    });

    expect(deriveDeterministicSuggestion(["missing_location"])).toEqual({
      label: "review",
      reasonCode: "missing_location",
    });

    expect(deriveDeterministicSuggestion([])).toEqual({
      label: "keep",
      reasonCode: "looks_valid",
    });
  });

  it("summarizes results by bucket and label", () => {
    const keepEvidence = toListingEvidence({
      placeId: "22222222-2222-2222-2222-222222222222",
      trackingBucket: "curated_place",
      placeType: "CURATED",
      organizationId: null,
      slug: "sunrise-pickleball-club",
      name: "Sunrise Pickleball Club",
      address: "789 Mango Avenue",
      city: "DUMAGUETE CITY",
      province: "NEGROS ORIENTAL",
      country: "PH",
      claimStatus: "UNCLAIMED",
      verificationStatus: "VERIFIED",
      activeCourtCount: 4,
      activeCourtLabels: ["Court 1"],
      activeSports: ["pickleball"],
      photoCount: 2,
      hasContactDetails: true,
    });

    const removeEvidence = toListingEvidence({
      placeId: "33333333-3333-3333-3333-333333333333",
      trackingBucket: "org_created_place",
      placeType: "RESERVABLE",
      organizationId: "44444444-4444-4444-4444-444444444444",
      slug: "test-pickleball-venue",
      name: "Test Pickleball Venue",
      address: "123 Sample Street",
      city: "CEBU CITY",
      province: "CEBU",
      country: "PH",
      claimStatus: "CLAIMED",
      verificationStatus: "NONE",
      activeCourtCount: 1,
      activeCourtLabels: ["Court A"],
      activeSports: ["pickleball"],
      photoCount: 0,
      hasContactDetails: false,
    });

    const report = summarizeReport({
      envLabel: "local",
      model: "gpt-5-mini",
      batchSize: 20,
      results: [
        {
          evidence: keepEvidence,
          decision: {
            placeId: keepEvidence.placeId,
            trackingBucket: keepEvidence.trackingBucket,
            label: "keep",
            confidence: "high",
            reasonCode: "looks_valid",
            reasonSummary: "Looks like a credible place listing.",
          },
        },
        {
          evidence: removeEvidence,
          decision: {
            placeId: removeEvidence.placeId,
            trackingBucket: removeEvidence.trackingBucket,
            label: "remove",
            confidence: "high",
            reasonCode: "nonprod_or_test",
            reasonSummary: "Looks like obvious test data.",
          },
        },
      ],
    });

    expect(report.totalPlaces).toBe(2);
    expect(report.labelCounts.keep).toBe(1);
    expect(report.labelCounts.remove).toBe(1);
    expect(report.reasonCounts.nonprod_or_test).toBe(1);
    expect(report.summaries).toHaveLength(2);
  });
});
