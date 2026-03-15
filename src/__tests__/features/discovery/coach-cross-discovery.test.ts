import { describe, expect, it } from "vitest";
import {
  buildCoachDiscoveryEntryLabel,
  buildCoachDiscoveryHrefFromCourtFilters,
} from "@/features/discovery/coach-cross-discovery";

describe("buildCoachDiscoveryHrefFromCourtFilters", () => {
  it("returns the base coaches route when no shared filters are present", () => {
    expect(buildCoachDiscoveryHrefFromCourtFilters({})).toBe("/coaches");
  });

  it("preserves search text on the base coaches route", () => {
    expect(
      buildCoachDiscoveryHrefFromCourtFilters({
        q: "  private sessions ",
      }),
    ).toBe("/coaches?q=private+sessions");
  });

  it("maps shared location filters to the equivalent coach location route", () => {
    expect(
      buildCoachDiscoveryHrefFromCourtFilters({
        province: "cebu",
        city: "cebu-city",
        sportId: "sport-1",
        sports: [{ id: "sport-1", slug: "badminton" }],
      }),
    ).toBe("/coaches/locations/cebu/cebu-city/badminton");
  });

  it("retains unresolved sport ids as query params on coach city routes", () => {
    expect(
      buildCoachDiscoveryHrefFromCourtFilters({
        province: "cebu",
        city: "cebu-city",
        sportId: "sport-1",
        q: "coach mia",
      }),
    ).toBe("/coaches/locations/cebu/cebu-city?q=coach+mia&sportId=sport-1");
  });
});

describe("buildCoachDiscoveryEntryLabel", () => {
  it("builds contextual labels when location and sport are known", () => {
    expect(
      buildCoachDiscoveryEntryLabel({
        locationLabel: "Cebu City",
        sportName: "Badminton",
      }),
    ).toBe("Explore Badminton coaches in Cebu City");
  });

  it("falls back to a generic coaches label", () => {
    expect(buildCoachDiscoveryEntryLabel({})).toBe("Explore coaches");
  });
});
