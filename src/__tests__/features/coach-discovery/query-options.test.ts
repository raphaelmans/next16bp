import { describe, expect, it } from "vitest";
import {
  buildCoachDiscoveryCacheTags,
  buildCoachListSummaryQueryInput,
} from "@/features/coach-discovery/query-options";

describe("buildCoachListSummaryQueryInput", () => {
  it("builds normalized query input with pagination offset", () => {
    expect(
      buildCoachListSummaryQueryInput({
        q: "  Coach Mia  ",
        province: "Cebu",
        city: "Cebu City",
        sportId: "sport-pickleball",
        minRate: 800,
        maxRate: 2400,
        minRating: 4,
        skillLevel: "ADVANCED",
        ageGroup: "ADULTS",
        sessionType: "PRIVATE",
        verified: true,
        page: 2,
        limit: 9,
      }),
    ).toEqual({
      q: "Coach Mia",
      province: "Cebu",
      city: "Cebu City",
      sportId: "sport-pickleball",
      minRate: 80000,
      maxRate: 240000,
      minRating: 4,
      skillLevel: "ADVANCED",
      ageGroup: "ADULTS",
      sessionType: "PRIVATE",
      verified: true,
      limit: 9,
      offset: 9,
    });
  });

  it("drops invalid or inactive filter values", () => {
    expect(
      buildCoachListSummaryQueryInput({
        q: "   ",
        minRate: -1,
        maxRate: Number.NaN,
        minRating: 7,
        verified: false,
      }),
    ).toEqual({
      limit: 12,
      offset: 0,
    });
  });
});

describe("buildCoachDiscoveryCacheTags", () => {
  it("builds province and city scoped cache tags", () => {
    expect(
      buildCoachDiscoveryCacheTags({
        provinceSlug: "cebu",
        citySlug: "cebu-city",
      }),
    ).toEqual([
      "discovery:coaches:list",
      "discovery:coaches:province:cebu",
      "discovery:coaches:city:cebu:cebu-city",
    ]);
  });
});
