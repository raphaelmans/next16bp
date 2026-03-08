import { describe, expect, it } from "vitest";
import {
  buildDiscoveryPlaceListSummaryQueryInput,
  normalizeDiscoveryAvailabilityInput,
} from "@/features/discovery/query-options";

describe("normalizeDiscoveryAvailabilityInput", () => {
  it("ignores date and time when sportId is missing", () => {
    expect(
      normalizeDiscoveryAvailabilityInput({
        date: "2026-03-08",
        time: ["10:00"],
      }),
    ).toEqual({});
  });

  it("keeps date and time when sportId and date are valid", () => {
    expect(
      normalizeDiscoveryAvailabilityInput({
        sportId: "sport-1",
        date: "2026-03-08",
        time: ["10:00"],
      }),
    ).toEqual({
      date: "2026-03-08",
      time: ["10:00"],
    });
  });

  it("drops invalid time values while preserving the valid date", () => {
    expect(
      normalizeDiscoveryAvailabilityInput({
        sportId: "sport-1",
        date: "2026-03-08",
        time: ["bad-time"],
      }),
    ).toEqual({
      date: "2026-03-08",
    });
  });
});

describe("buildDiscoveryPlaceListSummaryQueryInput", () => {
  it("builds availability-aware input when sport and date are present", () => {
    expect(
      buildDiscoveryPlaceListSummaryQueryInput({
        sportId: "sport-1",
        provinceName: "Cebu",
        cityName: "Cebu City",
        date: "2026-03-08",
        time: ["10:00"],
        page: 2,
        limit: 12,
      }),
    ).toEqual({
      sportId: "sport-1",
      province: "Cebu",
      city: "Cebu City",
      date: "2026-03-08",
      time: ["10:00"],
      limit: 12,
      offset: 12,
    });
  });

  it("drops availability inputs when sport is missing", () => {
    expect(
      buildDiscoveryPlaceListSummaryQueryInput({
        date: "2026-03-08",
        time: ["10:00"],
      }),
    ).toEqual({
      limit: 12,
      offset: 0,
    });
  });
});
