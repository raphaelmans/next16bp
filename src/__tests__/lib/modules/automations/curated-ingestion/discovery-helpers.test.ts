import { describe, expect, it } from "vitest";
import { buildCuratedLeadQueries } from "@/lib/modules/automations/curated-ingestion/shared/query-builder";
import { scoreDiscoverySearchResult } from "@/lib/modules/automations/curated-ingestion/shared/relevance-scoring";
import {
  canonicalizeLeadUrl,
  normalizeLocationSlug,
} from "@/lib/modules/automations/curated-ingestion/shared/url-normalization";

describe("curated lead discovery helpers", () => {
  it("builds deterministic city-first pickleball search queries", () => {
    expect(
      buildCuratedLeadQueries({
        city: "Cebu City",
        province: "Cebu",
        sportSlug: "pickleball",
      }),
    ).toEqual([
      "pickleball courts in Cebu Cebu City",
      "pickleball court Cebu City Cebu",
      "pickleball reservations Cebu City Cebu",
      "pickleball booking Cebu City Cebu",
      "site:facebook.com pickleball Cebu City Cebu",
    ]);
  });

  it("canonicalizes urls for stable state keys", () => {
    expect(
      canonicalizeLeadUrl(
        "https://www.example.com/courts/?utm_source=x&ref=abc&page=2#top",
      ),
    ).toBe("https://example.com/courts?page=2");
  });

  it("normalizes location strings into safe path slugs", () => {
    expect(normalizeLocationSlug("Cebu City")).toBe("cebu-city");
  });

  it("scores venue-like pickleball pages above threshold", () => {
    const result = scoreDiscoverySearchResult(
      {
        url: "https://example.com/cebu-city-pickleball-courts",
        title: "Pickleball Courts in Cebu City",
        description: "Book indoor pickleball courts in Cebu City, Cebu",
      },
      {
        city: "Cebu City",
        province: "Cebu",
        sportSlug: "pickleball",
      },
    );

    expect(result.score).toBeGreaterThanOrEqual(6);
    expect(result.isLikelyVenueLead).toBe(true);
  });

  it("penalizes legal/noise pages below threshold", () => {
    const result = scoreDiscoverySearchResult(
      {
        url: "https://example.com/privacy-policy",
        title: "Privacy Policy",
        description: "Privacy policy for Example Sports",
      },
      {
        city: "Cebu City",
        province: "Cebu",
        sportSlug: "pickleball",
      },
    );

    expect(result.isLikelyVenueLead).toBe(false);
  });
});
