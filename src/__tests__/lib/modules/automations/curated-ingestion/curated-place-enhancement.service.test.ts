import { describe, expect, it, vi } from "vitest";
import {
  type CuratedPlaceEnhancementCandidate,
  type CuratedPlaceEnhancementExtraction,
  type CuratedPlaceEnhancementJudgement,
  type CuratedPlaceEnhancementPayload,
  CuratedPlaceEnhancementService,
  mergeEnhancementPayloadIntoCandidate,
} from "@/lib/modules/automations/curated-ingestion/services/curated-place-enhancement.service";

const createCandidate = (
  overrides: Partial<CuratedPlaceEnhancementCandidate> = {},
): CuratedPlaceEnhancementCandidate => ({
  place: {
    id: "place-1",
    name: "Old Venue",
    slug: "old-venue",
    address: "Old Address",
    city: "Cebu City",
    province: "Cebu",
    country: "PH",
    timeZone: "Asia/Manila",
    websiteEnhancementStatus: "NOT_STARTED",
    facebookEnhancementStatus: "NOT_STARTED",
  },
  contactDetail: {
    websiteUrl: "https://old.example.com",
    facebookUrl: "https://facebook.com/oldvenue",
    instagramUrl: null,
    phoneNumber: null,
    viberInfo: null,
    otherContactInfo: null,
  },
  amenities: ["Parking"],
  photoUrls: ["https://cdn.example.com/old.jpg"],
  courts: [
    {
      id: "court-1",
      sportId: "sport-1",
      label: "Court 1",
      isActive: true,
    },
  ],
  ...overrides,
});

const createPayload = (
  overrides: Partial<CuratedPlaceEnhancementPayload> = {},
): CuratedPlaceEnhancementPayload => ({
  name: "New Venue",
  address: "New Address",
  websiteUrl: "https://new.example.com",
  facebookUrl: "https://facebook.com/newvenue",
  instagramUrl: "https://instagram.com/newvenue",
  viberInfo: "09171234567",
  otherContactInfo: "contact@newvenue.test",
  amenities: ["Showers", "Parking"],
  photoUrls: [
    "https://cdn.example.com/old.jpg",
    "https://cdn.example.com/new.jpg",
  ],
  desiredCourtCount: 3,
  ...overrides,
});

const createExtraction = (
  source: CuratedPlaceEnhancementExtraction["source"],
  payload = createPayload(),
): CuratedPlaceEnhancementExtraction =>
  source === "website"
    ? {
        source,
        payload,
        evidence: {
          source,
          requestUrl: "https://old.example.com",
          sourceUrl: "https://old.example.com",
          extractItem: { name: payload.name ?? "Venue" },
          extractedRecord: { address: payload.address ?? "Address" },
        },
      }
    : {
        source,
        payload,
        evidence: {
          source,
          requestUrl: "https://facebook.com/oldvenue",
          capturedPage: {
            pageUrl: "https://facebook.com/oldvenue",
            title: "Old Venue",
            bodyText: "Evidence body text",
            links: [],
            ogTitle: "Old Venue",
            ogDescription: "Venue description",
          },
          analysis: {
            status: "ready",
            confidence: "high",
            reason: "Looks correct",
            name: payload.name,
            address: payload.address,
            phone: null,
            email: null,
            instagramUrl: payload.instagramUrl,
            websiteUrl: payload.websiteUrl,
            amenities: payload.amenities,
            courtCount: payload.desiredCourtCount,
            isVenue: true,
            isWithinScope: true,
            evidence: ["Looks correct"],
          },
        },
      };

const createJudgement = (
  overrides: Partial<CuratedPlaceEnhancementJudgement> = {},
): CuratedPlaceEnhancementJudgement => ({
  decision: "approve",
  confidence: "high",
  summary: "Safe to apply",
  criteria: {
    venueIdentity: "pass",
    locationScope: "pass",
    contactQuality: "pass",
    payloadQuality: "pass",
  },
  improvedPayload: createPayload(),
  ...overrides,
});

const createHarness = (candidate = createCandidate()) => {
  const repository = {
    findCandidatesByIds: vi.fn().mockResolvedValue([candidate]),
    listEligibleCandidates: vi.fn(),
    persistOutcome: vi
      .fn()
      .mockImplementation(
        async (input: { mergedRecord: { hasChanges: boolean } | null }) => ({
          changed: input.mergedRecord?.hasChanges ?? false,
        }),
      ),
  };
  const providers = {
    enhanceFromWebsite:
      vi.fn<() => Promise<CuratedPlaceEnhancementExtraction | null>>(),
    enhanceFromFacebook:
      vi.fn<() => Promise<CuratedPlaceEnhancementExtraction | null>>(),
  };
  const judge = {
    judge: vi.fn<() => Promise<CuratedPlaceEnhancementJudgement>>(),
  };

  const service = new CuratedPlaceEnhancementService(
    repository as never,
    providers as never,
    judge as never,
  );

  return {
    service,
    repository,
    providers,
    judge,
  };
};

describe("CuratedPlaceEnhancementService", () => {
  it("marks website enhancement completed and skips Facebook fallback when website extraction is approved", async () => {
    const candidate = createCandidate();
    const extraction = createExtraction("website");
    const { service, providers, repository, judge } = createHarness(candidate);

    providers.enhanceFromWebsite.mockResolvedValueOnce(extraction);
    judge.judge.mockResolvedValueOnce(
      createJudgement({ improvedPayload: extraction.payload }),
    );

    const result = await service.enhancePlacesByIds(["place-1"], {
      sourceMode: "auto",
    });

    expect(providers.enhanceFromWebsite).toHaveBeenCalledWith({
      placeId: "place-1",
      sportSlug: "pickleball",
      url: "https://old.example.com",
    });
    expect(providers.enhanceFromFacebook).not.toHaveBeenCalled();
    expect(judge.judge).toHaveBeenCalledWith({
      candidate,
      extraction,
    });
    expect(repository.persistOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: "place-1",
        mergedPayload: extraction.payload,
        website: expect.objectContaining({
          status: "COMPLETED",
          error: null,
        }),
        facebook: null,
      }),
    );
    expect(result.changedPlaceIds).toEqual(["place-1"]);
    expect(result.reviewedPlaceIds).toEqual([]);
  });

  it("falls back to Facebook enhancement when website enhancement throws", async () => {
    const candidate = createCandidate();
    const extraction = createExtraction("facebook", {
      ...createPayload(),
      websiteUrl: null,
      facebookUrl: "https://facebook.com/fallbackvenue",
    });
    const { service, providers, repository, judge } = createHarness(candidate);

    providers.enhanceFromWebsite.mockRejectedValueOnce(new Error("rate limit"));
    providers.enhanceFromFacebook.mockResolvedValueOnce(extraction);
    judge.judge.mockResolvedValueOnce(
      createJudgement({ improvedPayload: extraction.payload }),
    );

    await service.enhancePlacesByIds(["place-1"], {
      sourceMode: "auto",
    });

    expect(providers.enhanceFromFacebook).toHaveBeenCalledWith({
      city: "Cebu City",
      placeId: "place-1",
      province: "Cebu",
      sportSlug: "pickleball",
      url: "https://facebook.com/oldvenue",
    });
    expect(repository.persistOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: "place-1",
        mergedPayload: extraction.payload,
        website: expect.objectContaining({
          status: "FAILED",
          error: "rate limit",
        }),
        facebook: expect.objectContaining({
          status: "COMPLETED",
          error: null,
        }),
      }),
    );
  });

  it("records a website failure when the extracted result is empty and no fallback URL exists", async () => {
    const candidate = createCandidate({
      contactDetail: {
        websiteUrl: "https://old.example.com",
        facebookUrl: null,
        instagramUrl: null,
        phoneNumber: null,
        viberInfo: null,
        otherContactInfo: null,
      },
    });
    const { service, providers, repository } = createHarness(candidate);

    providers.enhanceFromWebsite.mockResolvedValueOnce(null);

    const result = await service.enhancePlacesByIds(["place-1"], {
      sourceMode: "auto",
    });

    expect(repository.persistOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: "place-1",
        mergedPayload: null,
        website: expect.objectContaining({
          status: "FAILED",
          error: "No usable website enhancement payload",
        }),
        facebook: null,
      }),
    );
    expect(result.changedPlaceIds).toEqual([]);
    expect(result.reviewedPlaceIds).toEqual([]);
  });

  it("marks review-required outcomes and skips writes when the judge rejects the website payload", async () => {
    const candidate = createCandidate();
    const extraction = createExtraction("website");
    const { service, providers, repository, judge } = createHarness(candidate);

    providers.enhanceFromWebsite.mockResolvedValueOnce(extraction);
    judge.judge.mockResolvedValueOnce(
      createJudgement({
        decision: "review",
        confidence: "medium",
        summary: "Address is too ambiguous to auto-apply",
        criteria: {
          venueIdentity: "pass",
          locationScope: "uncertain",
          contactQuality: "pass",
          payloadQuality: "uncertain",
        },
      }),
    );

    const result = await service.enhancePlacesByIds(["place-1"], {
      sourceMode: "website",
    });

    expect(repository.persistOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        placeId: "place-1",
        mergedPayload: null,
        mergedRecord: null,
        website: expect.objectContaining({
          status: "REVIEW_REQUIRED",
          error: "Address is too ambiguous to auto-apply",
        }),
      }),
    );
    expect(result.changedPlaceIds).toEqual([]);
    expect(result.reviewedPlaceIds).toEqual(["place-1"]);
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0]?.summary).toBe(
      "Address is too ambiguous to auto-apply",
    );
  });
});

describe("mergeEnhancementPayloadIntoCandidate", () => {
  it("overwrites mutable core fields, unions amenities and photos, and reshapes generic courts", () => {
    const candidate = createCandidate();
    const merged = mergeEnhancementPayloadIntoCandidate(
      candidate,
      createPayload(),
    );

    expect(merged.placePatch).toEqual({
      name: "New Venue",
      address: "New Address",
    });
    expect(merged.contactDetailPatch).toEqual({
      websiteUrl: "https://new.example.com",
      facebookUrl: "https://facebook.com/newvenue",
      instagramUrl: "https://instagram.com/newvenue",
      viberInfo: "09171234567",
      otherContactInfo: "contact@newvenue.test",
    });
    expect(merged.amenities).toEqual(["Parking", "Showers"]);
    expect(merged.photoUrlsToAdd).toEqual(["https://cdn.example.com/new.jpg"]);
    expect(merged.courtPlan).toEqual({
      mode: "sync-generic",
      desiredCount: 3,
      sportId: "sport-1",
    });
  });

  it("leaves customized courts untouched", () => {
    const candidate = createCandidate({
      courts: [
        {
          id: "court-1",
          sportId: "sport-1",
          label: "Championship Court",
          isActive: true,
        },
      ],
    });

    const merged = mergeEnhancementPayloadIntoCandidate(
      candidate,
      createPayload({ desiredCourtCount: 4 }),
    );

    expect(merged.courtPlan).toEqual({
      mode: "skip-customized",
      desiredCount: 4,
      sportId: "sport-1",
    });
  });
});
