import { describe, expect, it } from "vitest";
import {
  CURATED_DISCOVERY_DEFAULT_SPORT_SLUG,
  CURATED_DISCOVERY_SCOPES,
  resolveCuratedDiscoveryScopeOrThrow,
  resolveDefaultCuratedDiscoveryScopes,
} from "@/lib/modules/automations/curated-ingestion/shared/curated-discovery-scopes";

describe("curated discovery scopes", () => {
  it("resolves the configured default scopes against the canonical PH catalog", async () => {
    const scopes = await resolveDefaultCuratedDiscoveryScopes();

    expect(scopes).toHaveLength(CURATED_DISCOVERY_SCOPES.length);
    expect(CURATED_DISCOVERY_SCOPES[0]).not.toHaveProperty("sportSlug");
    expect(scopes).toContainEqual({
      sportSlug: CURATED_DISCOVERY_DEFAULT_SPORT_SLUG,
      provinceSlug: "negros-oriental",
      citySlug: "dumaguete-city",
      provinceName: "Negros Oriental",
      cityName: "Dumaguete City",
    });
  });

  it("accepts canonical province and city slugs from the PH catalog", async () => {
    await expect(
      resolveCuratedDiscoveryScopeOrThrow({
        sportSlug: "pickleball",
        provinceValue: "cebu",
        cityValue: "cebu-city",
      }),
    ).resolves.toMatchObject({
      provinceSlug: "cebu",
      citySlug: "cebu-city",
    });
  });

  it("fails fast when the province slug is not in the PH catalog", async () => {
    await expect(
      resolveCuratedDiscoveryScopeOrThrow({
        sportSlug: "pickleball",
        provinceValue: "cebuu",
        cityValue: "cebu-city",
      }),
    ).rejects.toThrow(/Unknown province/);
  });

  it("fails fast when the city slug is not valid for the given province", async () => {
    await expect(
      resolveCuratedDiscoveryScopeOrThrow({
        sportSlug: "pickleball",
        provinceValue: "cebu",
        cityValue: "non-existent-city",
      }),
    ).rejects.toThrow(/Unknown city/);
  });
});
