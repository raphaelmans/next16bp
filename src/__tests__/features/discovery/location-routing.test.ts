import { describe, expect, it } from "vitest";
import {
  buildDiscoveryLocationPath,
  buildLegacyDiscoveryLocationRedirectPath,
  getDiscoveryIgnoredLocationQueryKeys,
  sanitizeDiscoveryLocationSearchParams,
} from "@/features/discovery/location-routing";

describe("buildDiscoveryLocationPath", () => {
  const sports = [
    { id: "sport-badminton", slug: "badminton" },
    { id: "sport-pickleball", slug: "pickleball" },
  ];

  it("builds a sport path when province, city, and sport are available", () => {
    expect(
      buildDiscoveryLocationPath({
        location: {
          province: "cebu",
          city: "cebu-city",
          sportId: "sport-badminton",
        },
        sports,
      }),
    ).toEqual({
      pathname: "/courts/locations/cebu/cebu-city/badminton",
      retainedLocationQuery: {},
    });
  });

  it("keeps sportId in query when city is missing", () => {
    expect(
      buildDiscoveryLocationPath({
        location: {
          province: "cebu",
          sportId: "sport-badminton",
        },
        sports,
      }),
    ).toEqual({
      pathname: "/courts/locations/cebu",
      retainedLocationQuery: {
        sportId: "sport-badminton",
      },
    });
  });

  it("falls back to the city path when the sport cannot be resolved", () => {
    expect(
      buildDiscoveryLocationPath({
        location: {
          province: "cebu",
          city: "cebu-city",
          sportId: "unknown-sport",
        },
        sports,
      }),
    ).toEqual({
      pathname: "/courts/locations/cebu/cebu-city",
      retainedLocationQuery: {
        sportId: "unknown-sport",
      },
    });
  });
});

describe("sanitizeDiscoveryLocationSearchParams", () => {
  it("drops province and city query params on province-scoped routes", () => {
    expect(
      sanitizeDiscoveryLocationSearchParams(
        {
          province: "cebu",
          city: "naga-city",
          sportId: "sport-badminton",
          date: "2026-03-09",
        },
        "province",
      ),
    ).toEqual({
      sportId: "sport-badminton",
      date: "2026-03-09",
    });
  });

  it("drops all location query params on city-scoped routes", () => {
    expect(
      sanitizeDiscoveryLocationSearchParams(
        {
          province: "cebu",
          city: "cebu-city",
          sportId: "sport-badminton",
          verification: "verified_reservable",
        },
        "city",
      ),
    ).toEqual({
      verification: "verified_reservable",
    });
  });
});

describe("buildDiscoveryLegacyRedirectPath", () => {
  it("redirects province-scoped legacy city filters into the pathname", () => {
    expect(
      buildLegacyDiscoveryLocationRedirectPath({
        scope: "province",
        currentLocation: { province: "cebu" },
        redirectedCity: "naga-city",
        redirectedSportSlug: "badminton",
      }),
    ).toBe("/courts/locations/cebu/naga-city/badminton");
  });

  it("redirects city-scoped legacy sport filters into the pathname", () => {
    expect(
      buildLegacyDiscoveryLocationRedirectPath({
        scope: "city",
        currentLocation: { province: "cebu", city: "cebu-city" },
        redirectedSportSlug: "pickleball",
      }),
    ).toBe("/courts/locations/cebu/cebu-city/pickleball");
  });
});

describe("getDiscoveryIgnoredLocationQueryKeys", () => {
  it("keeps sportId query filtering available on province routes", () => {
    expect(getDiscoveryIgnoredLocationQueryKeys("province")).toEqual([
      "province",
      "city",
    ]);
  });

  it("treats province, city, and sportId as path-backed on sport routes", () => {
    expect(getDiscoveryIgnoredLocationQueryKeys("sport")).toEqual([
      "province",
      "city",
      "sportId",
    ]);
  });
});
