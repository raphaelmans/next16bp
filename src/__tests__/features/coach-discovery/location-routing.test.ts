import { describe, expect, it } from "vitest";
import {
  buildCoachDiscoveryLocationPath,
  buildLegacyCoachDiscoveryLocationRedirectPath,
  getCoachDiscoveryIgnoredLocationQueryKeys,
  sanitizeCoachDiscoveryLocationSearchParams,
} from "@/features/coach-discovery/location-routing";

describe("buildCoachDiscoveryLocationPath", () => {
  const sports = [
    { id: "sport-badminton", slug: "badminton" },
    { id: "sport-pickleball", slug: "pickleball" },
  ];

  it("builds a sport path when province, city, and sport are available", () => {
    expect(
      buildCoachDiscoveryLocationPath({
        location: {
          province: "cebu",
          city: "cebu-city",
          sportId: "sport-badminton",
        },
        sports,
      }),
    ).toEqual({
      pathname: "/coaches/locations/cebu/cebu-city/badminton",
      retainedLocationQuery: {},
    });
  });

  it("keeps sportId in query when city is missing", () => {
    expect(
      buildCoachDiscoveryLocationPath({
        location: {
          province: "cebu",
          sportId: "sport-badminton",
        },
        sports,
      }),
    ).toEqual({
      pathname: "/coaches/locations/cebu",
      retainedLocationQuery: {
        sportId: "sport-badminton",
      },
    });
  });

  it("falls back to the city path when the sport cannot be resolved", () => {
    expect(
      buildCoachDiscoveryLocationPath({
        location: {
          province: "cebu",
          city: "cebu-city",
          sportId: "unknown-sport",
        },
        sports,
      }),
    ).toEqual({
      pathname: "/coaches/locations/cebu/cebu-city",
      retainedLocationQuery: {
        sportId: "unknown-sport",
      },
    });
  });
});

describe("sanitizeCoachDiscoveryLocationSearchParams", () => {
  it("drops province and city query params on province-scoped routes", () => {
    expect(
      sanitizeCoachDiscoveryLocationSearchParams(
        {
          province: "cebu",
          city: "naga-city",
          sportId: "sport-badminton",
          minRate: "800",
        },
        "province",
      ),
    ).toEqual({
      sportId: "sport-badminton",
      minRate: "800",
    });
  });

  it("drops all location query params on city-scoped routes", () => {
    expect(
      sanitizeCoachDiscoveryLocationSearchParams(
        {
          province: "cebu",
          city: "cebu-city",
          sportId: "sport-badminton",
          verified: "true",
        },
        "city",
      ),
    ).toEqual({
      verified: "true",
    });
  });
});

describe("buildCoachDiscoveryLegacyRedirectPath", () => {
  it("redirects province-scoped legacy city filters into the pathname", () => {
    expect(
      buildLegacyCoachDiscoveryLocationRedirectPath({
        scope: "province",
        currentLocation: { province: "cebu" },
        redirectedCity: "naga-city",
        redirectedSportSlug: "badminton",
      }),
    ).toBe("/coaches/locations/cebu/naga-city/badminton");
  });

  it("redirects city-scoped legacy sport filters into the pathname", () => {
    expect(
      buildLegacyCoachDiscoveryLocationRedirectPath({
        scope: "city",
        currentLocation: { province: "cebu", city: "cebu-city" },
        redirectedSportSlug: "pickleball",
      }),
    ).toBe("/coaches/locations/cebu/cebu-city/pickleball");
  });
});

describe("getCoachDiscoveryIgnoredLocationQueryKeys", () => {
  it("keeps sportId query filtering available on province routes", () => {
    expect(getCoachDiscoveryIgnoredLocationQueryKeys("province")).toEqual([
      "province",
      "city",
    ]);
  });

  it("treats province, city, and sportId as path-backed on sport routes", () => {
    expect(getCoachDiscoveryIgnoredLocationQueryKeys("sport")).toEqual([
      "province",
      "city",
      "sportId",
    ]);
  });
});
