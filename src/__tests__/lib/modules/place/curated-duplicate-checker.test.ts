import { describe, expect, it } from "vitest";
import {
  buildCuratedDuplicateKey,
  classifyCuratedDuplicateRow,
  computeCuratedDuplicateCandidateMatch,
  extractPhoneTokens,
  jaccardScore,
  normalizeLoose,
  normalizeUrl,
  tokenize,
} from "@/lib/modules/place/curated-duplicate-checker";
import {
  approvedLowSignalFixture,
  createCandidate,
  createMatch,
  exactNameCityProvinceFixture,
  sameBranchSocialFixture,
  semanticReviewFixture,
  sharedSocialFalsePositiveFixture,
} from "./curated-duplicate-checker.fixtures";

describe("curated duplicate checker", () => {
  it("normalizes loose text for lexical matching", () => {
    expect(normalizeLoose("  Dink N’ Dash Pickleball  ")).toBe(
      "dink n dash pickleball",
    );
  });

  it("tokenizes normalized words only", () => {
    expect(tokenize("HQ Pickleball Cebu")).toEqual([
      "hq",
      "pickleball",
      "cebu",
    ]);
  });

  it("computes jaccard overlap for token sets", () => {
    expect(jaccardScore(["match", "point"], ["match", "point", "cebu"])).toBe(
      2 / 3,
    );
    expect(jaccardScore([], ["cebu"])).toBe(0);
  });

  it("extracts phone-like digit groups from mixed strings", () => {
    expect(
      Array.from(extractPhoneTokens("09177019131; hotline 2730325")),
    ).toEqual(["09177019131", "2730325"]);
  });

  it("normalizes equivalent social urls to the same key", () => {
    expect(
      normalizeUrl("https://www.facebook.com/matchpoint.cebu/?ref=123#top"),
    ).toBe(normalizeUrl("https://facebook.com/matchpoint.cebu/"));
  });

  it("computes exact-name duplicates with strong lexical and total score", () => {
    const row = exactNameCityProvinceFixture.row;
    const candidate = createCandidate({
      id: "place-magnum",
      name: "Magnum Sports Complex",
      address: "8WM4+JW, San Miguel Rd, Apas, Cebu City, 6000 Cebu",
      city: "CEBU CITY",
      province: "CEBU",
    });

    const match = computeCuratedDuplicateCandidateMatch(row, candidate, 0.919);

    expect(match.sameName).toBe(true);
    expect(match.sameCity).toBe(true);
    expect(match.sameProvince).toBe(true);
    expect(match.nameTokenScore).toBe(1);
    expect(match.totalScore).toBeGreaterThan(0.9);
  });

  it("classifies same normalized name + city + province as duplicate", () => {
    const result = classifyCuratedDuplicateRow(
      exactNameCityProvinceFixture.row,
      [exactNameCityProvinceFixture.bestMatch],
      new Set(),
    );

    expect(result).toEqual({
      status: "duplicate",
      reason: "same normalized name + city + province",
    });
  });

  it("classifies same normalized name with address overlap in same province as duplicate", () => {
    const row = approvedLowSignalFixture.row;
    const bestMatch = createMatch({
      placeId: "place-address",
      name: "HillHouse Liloan",
      city: "CONSOLACION",
      province: "CEBU",
      embeddingScore: 0.74,
      lexicalScore: 0.66,
      totalScore: 0.705,
      sameCity: false,
      sameProvince: true,
      sameName: true,
      urlMatchCount: 0,
      phoneMatch: false,
      addressTokenScore: 0.4,
      nameTokenScore: 1,
      reason: "strong name overlap in same province",
    });

    const result = classifyCuratedDuplicateRow(row, [bestMatch], new Set());

    expect(result).toEqual({
      status: "duplicate",
      reason: "same normalized name with overlapping address in same province",
    });
  });

  it("keeps shared-social low-similarity cross-city cases out of duplicate", () => {
    const result = classifyCuratedDuplicateRow(
      sharedSocialFalsePositiveFixture.row,
      [sharedSocialFalsePositiveFixture.bestMatch],
      new Set(),
    );

    expect(result).toEqual({
      status: "review",
      reason: "needs manual review due to shared metadata",
    });
  });

  it("still marks same-city same-social branch rows as duplicate", () => {
    const result = classifyCuratedDuplicateRow(
      sameBranchSocialFixture.row,
      [sameBranchSocialFixture.bestMatch],
      new Set(),
    );

    expect(result).toEqual({
      status: "duplicate",
      reason: "same social/website url",
    });
  });

  it("marks very high embedding similarity as duplicate even without metadata match", () => {
    const row = approvedLowSignalFixture.row;
    const bestMatch = createMatch({
      placeId: "place-embed-max",
      name: "Unrelated Lexical Name",
      city: "DUMAGUETE CITY",
      province: "NEGROS ORIENTAL",
      embeddingScore: 0.97,
      lexicalScore: 0.1,
      totalScore: 0.57,
      sameCity: false,
      sameProvince: false,
      sameName: false,
      urlMatchCount: 0,
      phoneMatch: false,
      addressTokenScore: 0,
      nameTokenScore: 0.1,
      reason: "high embedding similarity",
    });

    const result = classifyCuratedDuplicateRow(row, [bestMatch], new Set());

    expect(result).toEqual({
      status: "duplicate",
      reason: "very high embedding similarity",
    });
  });

  it("marks high embedding similarity with matching location/name signals as duplicate", () => {
    const row = approvedLowSignalFixture.row;
    const bestMatch = createMatch({
      placeId: "place-embed-location",
      name: "HillHouse Burgers and Wings",
      city: "LILOAN",
      province: "CEBU",
      embeddingScore: 0.935,
      lexicalScore: 0.42,
      totalScore: 0.703,
      sameCity: true,
      sameProvince: true,
      sameName: false,
      urlMatchCount: 0,
      phoneMatch: false,
      addressTokenScore: 0.2,
      nameTokenScore: 0.32,
      reason: "high embedding similarity",
    });

    const result = classifyCuratedDuplicateRow(row, [bestMatch], new Set());

    expect(result).toEqual({
      status: "duplicate",
      reason: "high embedding similarity with matching location/name signals",
    });
  });

  it("marks embedding similarity confirmed by metadata/location as duplicate", () => {
    const row = approvedLowSignalFixture.row;
    const bestMatch = createMatch({
      placeId: "place-embed-metadata",
      name: "HillHouse Burgers and Wings",
      city: "MANDAUE CITY",
      province: "CEBU",
      embeddingScore: 0.9,
      lexicalScore: 0.31,
      totalScore: 0.635,
      sameCity: false,
      sameProvince: true,
      sameName: false,
      urlMatchCount: 0,
      phoneMatch: false,
      addressTokenScore: 0.41,
      nameTokenScore: 0.18,
      reason: "low-signal candidate",
    });

    const result = classifyCuratedDuplicateRow(row, [bestMatch], new Set());

    expect(result).toEqual({
      status: "duplicate",
      reason: "embedding similarity confirmed by metadata/location",
    });
  });

  it("sends medium semantic similarity cases to review", () => {
    const result = classifyCuratedDuplicateRow(
      semanticReviewFixture.row,
      [semanticReviewFixture.bestMatch],
      new Set(),
    );

    expect(result).toEqual({
      status: "review",
      reason: "needs manual review due to semantic similarity",
    });
  });

  it("sends strong lexical overlap cases to review", () => {
    const row = approvedLowSignalFixture.row;
    const bestMatch = createMatch({
      placeId: "place-lexical-review",
      name: "HillHouse Burgers and Wings",
      city: "NAGA CITY",
      province: "CEBU",
      embeddingScore: 0.7,
      lexicalScore: 0.61,
      totalScore: 0.66,
      sameCity: false,
      sameProvince: true,
      sameName: false,
      urlMatchCount: 0,
      phoneMatch: false,
      addressTokenScore: 0.22,
      nameTokenScore: 0.72,
      reason: "strong name overlap in same province",
    });

    const result = classifyCuratedDuplicateRow(row, [bestMatch], new Set());

    expect(result).toEqual({
      status: "review",
      reason: "needs manual review due to strong lexical overlap",
    });
  });

  it("sends shared metadata without stronger signals to review", () => {
    const row = approvedLowSignalFixture.row;
    const bestMatch = createMatch({
      placeId: "place-shared-meta",
      name: "Some Other Place",
      city: "TAGBILARAN",
      province: "BOHOL",
      embeddingScore: 0.6,
      lexicalScore: 0.15,
      totalScore: 0.398,
      sameCity: false,
      sameProvince: false,
      sameName: false,
      urlMatchCount: 1,
      phoneMatch: false,
      addressTokenScore: 0,
      nameTokenScore: 0.1,
      reason: "same social/website url",
    });

    const result = classifyCuratedDuplicateRow(row, [bestMatch], new Set());

    expect(result).toEqual({
      status: "review",
      reason: "needs manual review due to shared metadata",
    });
  });

  it("approves low-signal candidates even in the same city/province", () => {
    const result = classifyCuratedDuplicateRow(
      approvedLowSignalFixture.row,
      [approvedLowSignalFixture.bestMatch],
      new Set(),
    );

    expect(result).toEqual({
      status: "approved",
      reason: "no high-confidence duplicate signal",
    });
  });

  it("approves rows when there are no candidates", () => {
    const result = classifyCuratedDuplicateRow(
      approvedLowSignalFixture.row,
      [],
      new Set(),
    );

    expect(result).toEqual({
      status: "approved",
      reason: "no curated candidates found",
    });
  });

  it("deduplicates identical source rows within the same file", () => {
    const seen = new Set<string>();
    const row = approvedLowSignalFixture.row;

    const first = classifyCuratedDuplicateRow(row, [], seen);
    const second = classifyCuratedDuplicateRow(row, [], seen);

    expect(first.status).toBe("approved");
    expect(second).toEqual({
      status: "duplicate",
      reason: "duplicate row in source file",
    });
    expect(seen.has(buildCuratedDuplicateKey(row))).toBe(true);
  });

  it("treats phone-match same-province rows as duplicate", () => {
    const row = approvedLowSignalFixture.row;
    const bestMatch = createMatch({
      placeId: "place-phone",
      name: "HillHouse Burgers and Wings",
      city: "LILOAN",
      province: "CEBU",
      embeddingScore: 0.71,
      lexicalScore: 0.48,
      totalScore: 0.58,
      sameCity: true,
      sameProvince: true,
      sameName: false,
      urlMatchCount: 0,
      phoneMatch: true,
      addressTokenScore: 0.2,
      nameTokenScore: 0.25,
      reason: "same phone/viber",
    });

    const result = classifyCuratedDuplicateRow(row, [bestMatch], new Set());

    expect(result).toEqual({
      status: "duplicate",
      reason: "same phone/viber in same province",
    });
  });
});
