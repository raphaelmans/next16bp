import { describe, expect, it } from "vitest";
import {
  getAmenityDisplayLabel,
  getAmenityKey,
  mergeAmenityOptions,
  normalizeAmenityValues,
} from "@/common/amenities";

describe("amenities helpers", () => {
  it("normalizes amenity keys for case-insensitive comparisons", () => {
    expect(getAmenityKey("  Parking  ")).toBe("parking");
    expect(getAmenityKey("Pet Friendly")).toBe("pet friendly");
  });

  it("dedupes amenity values case-insensitively while preserving the first label", () => {
    expect(
      normalizeAmenityValues([
        " Parking ",
        "parking",
        "Pet Friendly",
        " pet friendly ",
        "",
      ]),
    ).toEqual(["Parking", "Pet Friendly"]);
  });

  it("prefers curated labels for known amenities when building display options", () => {
    expect(getAmenityDisplayLabel("parking")).toBe("Parking");
    expect(getAmenityDisplayLabel("wheelchair access")).toBe(
      "wheelchair access",
    );
  });

  it("merges amenity options into a sorted case-insensitive list", () => {
    expect(
      mergeAmenityOptions(
        ["parking", "Wheelchair Access"],
        ["Parking", "Pet Friendly"],
      ),
    ).toEqual(["Parking", "Pet Friendly", "Wheelchair Access"]);
  });
});
