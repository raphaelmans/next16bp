import { describe, expect, it } from "vitest";
import {
  buildKnownDomainQueries,
  classifyDiscoveryUrl,
} from "@/lib/modules/automations/curated-ingestion/shared/lead-source-strategy";
import { buildCuratedLeadQueryPlan } from "@/lib/modules/automations/curated-ingestion/shared/query-builder";
import { scoreDiscoverySearchResult } from "@/lib/modules/automations/curated-ingestion/shared/relevance-scoring";
import {
  canonicalizeLeadUrl,
  normalizeLocationSlug,
} from "@/lib/modules/automations/curated-ingestion/shared/url-normalization";

describe("curated lead discovery helpers", () => {
  it("builds deterministic city-first pickleball search queries", () => {
    expect(
      buildCuratedLeadQueryPlan({
        city: "Cebu City",
        province: "Cebu",
        sportSlug: "pickleball",
      }),
    ).toEqual({
      primary: [
        "pickleball courts in Cebu Cebu City",
        "pickleball court Cebu City Cebu",
        "Cebu City pickleball",
        "courts in Cebu City Cebu pickleball",
        "sports center Cebu City Cebu pickleball",
        "pickleball club Cebu City Cebu",
        "pickleball reservations Cebu City Cebu",
      ],
      knownDomain: [],
      fallback: [
        "site:pickleheads.com pickleball Cebu City Cebu",
        "site:playtimescheduler.com pickleball Cebu City Cebu",
        "site:app.court-access.com pickleball Cebu City Cebu",
        "dink Cebu City pickleball",
      ],
    });
  });

  it("builds scoped known-domain queries for configured local directories", () => {
    expect(
      buildKnownDomainQueries({
        city: "Talisay City",
        province: "Cebu",
        sportSlug: "pickleball",
      }),
    ).toEqual([
      "site:cebupickleballcourts.com Talisay City Cebu pickleball",
      "site:dumapickleball.com Talisay City Cebu pickleball",
    ]);
  });

  it("classifies static directory pages as map-first and detail pages as direct", () => {
    expect(
      classifyDiscoveryUrl("https://cebupickleballcourts.com/courts", {}),
    ).toMatchObject({
      strategy: "map_static_directory",
      shouldMap: true,
      shouldEmitDirectly: false,
    });

    expect(
      classifyDiscoveryUrl(
        "https://cebupickleballcourts.com/yb-pickleball-court",
      ),
    ).toMatchObject({
      strategy: "map_static_directory",
      shouldMap: false,
      shouldEmitDirectly: true,
    });
  });

  it("classifies dumapickleball as a mapped SPA lead-only source", () => {
    expect(
      classifyDiscoveryUrl("https://www.dumapickleball.com/courts"),
    ).toMatchObject({
      strategy: "map_spa_directory",
      shouldMap: true,
      shouldEmitDirectly: false,
    });
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

  it("treats playtimescheduler as a useful structured lead instead of generic noise", () => {
    const result = scoreDiscoverySearchResult(
      {
        url: "https://playtimescheduler.com/region/dumaguete-visayas",
        title: "Find Pickleball Games in Dumaguete, Visayas",
        description:
          "Pickleball Courts in Dumaguete including Incredoball Sports and Development Center and Pickle8",
      },
      {
        city: "Dumaguete City",
        province: "Negros Oriental",
        sportSlug: "pickleball",
      },
    );

    expect(result.score).toBeGreaterThan(0);
  });
});
