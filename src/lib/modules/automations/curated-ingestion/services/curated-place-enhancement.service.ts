import { mergeAmenityOptions } from "@/common/amenities";

export type PlaceEnhancementStatus =
  | "NOT_STARTED"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED"
  | "REVIEW_REQUIRED";

export interface CuratedPlaceEnhancementPayload {
  name: string | null;
  address: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  viberInfo: string | null;
  otherContactInfo: string | null;
  amenities: string[];
  photoUrls: string[];
  desiredCourtCount: number | null;
}

type JsonObject = Record<string, unknown>;

export interface CuratedPlaceEnhancementCandidate {
  place: {
    id: string;
    name: string;
    slug: string | null;
    address: string;
    city: string;
    province: string;
    country: string;
    timeZone: string;
    websiteEnhancementStatus: PlaceEnhancementStatus;
    facebookEnhancementStatus: PlaceEnhancementStatus;
  };
  contactDetail: {
    websiteUrl: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    phoneNumber: string | null;
    viberInfo: string | null;
    otherContactInfo: string | null;
  } | null;
  amenities: string[];
  photoUrls: string[];
  courts: Array<{
    id: string;
    sportId: string;
    label: string;
    isActive: boolean;
  }>;
}

export interface WebsiteEnhancementEvidence {
  source: "website";
  requestUrl: string;
  sourceUrl: string;
  extractItem: JsonObject;
  extractedRecord: JsonObject;
}

export interface FacebookCapturedPagePayload {
  pageUrl: string;
  title: string;
  bodyText: string;
  links: string[];
  ogTitle: string;
  ogDescription: string;
}

export interface FacebookEnhancementEvidence {
  source: "facebook";
  requestUrl: string;
  capturedPage: FacebookCapturedPagePayload;
  analysis: {
    status: "ready" | "review" | "skip";
    confidence: "high" | "medium" | "low";
    reason: string;
    name: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    instagramUrl: string | null;
    websiteUrl: string | null;
    amenities: string[];
    courtCount: number | null;
    isVenue: boolean;
    isWithinScope: boolean;
    evidence: string[];
  };
}

export type CuratedPlaceEnhancementEvidence =
  | WebsiteEnhancementEvidence
  | FacebookEnhancementEvidence;

export interface CuratedPlaceEnhancementExtraction {
  source: CuratedPlaceEnhancementEvidence["source"];
  payload: CuratedPlaceEnhancementPayload;
  evidence: CuratedPlaceEnhancementEvidence;
}

export interface CuratedPlaceEnhancementCriteriaAssessment {
  venueIdentity: "pass" | "uncertain" | "fail";
  locationScope: "pass" | "uncertain" | "fail";
  contactQuality: "pass" | "uncertain" | "fail";
  payloadQuality: "pass" | "uncertain" | "fail";
}

export interface CuratedPlaceEnhancementJudgement {
  decision: "approve" | "review";
  confidence: "high" | "medium" | "low";
  summary: string;
  criteria: CuratedPlaceEnhancementCriteriaAssessment;
  improvedPayload: CuratedPlaceEnhancementPayload;
}

export interface CuratedPlaceEnhancementReviewRecord {
  placeId: string;
  source: CuratedPlaceEnhancementEvidence["source"];
  confidence: CuratedPlaceEnhancementJudgement["confidence"];
  summary: string;
  criteria: CuratedPlaceEnhancementCriteriaAssessment;
  candidate: CuratedPlaceEnhancementCandidate;
  extraction: CuratedPlaceEnhancementExtraction;
  improvedPayload: CuratedPlaceEnhancementPayload;
}

export interface SourceEnhancementOutcome {
  status: PlaceEnhancementStatus;
  attemptedAt: string;
  enhancedAt: string | null;
  error: string | null;
}

export interface CuratedPlaceEnhancementPersistInput {
  placeId: string;
  mergedPayload: CuratedPlaceEnhancementPayload | null;
  mergedRecord: CuratedPlaceEnhancementMergeResult | null;
  website: SourceEnhancementOutcome | null;
  facebook: SourceEnhancementOutcome | null;
}

export interface CuratedPlaceEnhancementResult {
  placeId: string;
  changed: boolean;
  website: SourceEnhancementOutcome | null;
  facebook: SourceEnhancementOutcome | null;
  review: CuratedPlaceEnhancementReviewRecord | null;
}

export interface CuratedPlaceEnhancementBatchResult {
  processedPlaceIds: string[];
  changedPlaceIds: string[];
  skippedPlaceIds: string[];
  reviewedPlaceIds: string[];
  reviews: CuratedPlaceEnhancementReviewRecord[];
}

export interface CuratedPlaceEnhancementRepository {
  findCandidatesByIds(
    placeIds: string[],
  ): Promise<CuratedPlaceEnhancementCandidate[]>;
  listEligibleCandidates(input: {
    limit: number | null;
    sourceMode: CuratedPlaceEnhancementSourceMode;
    retryFailed: boolean;
    retryReviewRequired: boolean;
  }): Promise<CuratedPlaceEnhancementCandidate[]>;
  persistOutcome(
    input: CuratedPlaceEnhancementPersistInput,
  ): Promise<{ changed: boolean }>;
}

export interface CuratedPlaceEnhancementProviders {
  enhanceFromWebsite(input: {
    placeId: string;
    url: string;
    sportSlug: string;
  }): Promise<CuratedPlaceEnhancementExtraction | null>;
  enhanceFromFacebook(input: {
    placeId: string;
    url: string;
    city: string;
    province: string;
    sportSlug: string;
  }): Promise<CuratedPlaceEnhancementExtraction | null>;
}

export interface CuratedPlaceEnhancementJudge {
  judge(input: {
    candidate: CuratedPlaceEnhancementCandidate;
    extraction: CuratedPlaceEnhancementExtraction;
  }): Promise<CuratedPlaceEnhancementJudgement>;
}

export type CuratedPlaceEnhancementSourceMode = "auto" | "website" | "facebook";

export interface CuratedPlaceEnhancementOptions {
  sourceMode?: CuratedPlaceEnhancementSourceMode;
  sportSlug?: string;
  retryFailed?: boolean;
  retryReviewRequired?: boolean;
  force?: boolean;
}

export interface CuratedPlaceEnhancementMergeResult {
  placePatch: {
    name?: string;
    address?: string;
  };
  contactDetailPatch: {
    websiteUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    viberInfo?: string;
    otherContactInfo?: string;
  };
  amenities: string[];
  photoUrlsToAdd: string[];
  courtPlan:
    | {
        mode: "none";
        desiredCount: number | null;
        sportId: string | null;
      }
    | {
        mode: "sync-generic";
        desiredCount: number;
        sportId: string;
      }
    | {
        mode: "skip-customized";
        desiredCount: number;
        sportId: string | null;
      };
  hasChanges: boolean;
}

function trimToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildCompletedOutcome(attemptedAt: string): SourceEnhancementOutcome {
  return {
    status: "COMPLETED",
    attemptedAt,
    enhancedAt: attemptedAt,
    error: null,
  };
}

function buildFailedOutcome(
  attemptedAt: string,
  error: string,
): SourceEnhancementOutcome {
  return {
    status: "FAILED",
    attemptedAt,
    enhancedAt: null,
    error,
  };
}

function buildSkippedOutcome(attemptedAt: string): SourceEnhancementOutcome {
  return {
    status: "SKIPPED",
    attemptedAt,
    enhancedAt: null,
    error: null,
  };
}

function buildReviewRequiredOutcome(
  attemptedAt: string,
  summary: string,
): SourceEnhancementOutcome {
  return {
    status: "REVIEW_REQUIRED",
    attemptedAt,
    enhancedAt: null,
    error: summary,
  };
}

function isSourceCompleted(
  status: PlaceEnhancementStatus,
  options: CuratedPlaceEnhancementOptions,
) {
  if (options.force) return false;
  if (status === "COMPLETED") return true;
  if (status === "FAILED" && !options.retryFailed) return true;
  if (status === "REVIEW_REQUIRED" && !options.retryReviewRequired) {
    return true;
  }
  return false;
}

function isAutogeneratedCourtLabel(value: string) {
  return /^court\s+\d+$/i.test(value.trim());
}

function arraysMatch(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function buildReviewRecord(input: {
  candidate: CuratedPlaceEnhancementCandidate;
  extraction: CuratedPlaceEnhancementExtraction;
  judgement: CuratedPlaceEnhancementJudgement;
}): CuratedPlaceEnhancementReviewRecord {
  return {
    placeId: input.candidate.place.id,
    source: input.extraction.source,
    confidence: input.judgement.confidence,
    summary: input.judgement.summary,
    criteria: input.judgement.criteria,
    candidate: input.candidate,
    extraction: input.extraction,
    improvedPayload: input.judgement.improvedPayload,
  };
}

export function mergeEnhancementPayloadIntoCandidate(
  candidate: CuratedPlaceEnhancementCandidate,
  payload: CuratedPlaceEnhancementPayload,
): CuratedPlaceEnhancementMergeResult {
  const placePatch: CuratedPlaceEnhancementMergeResult["placePatch"] = {};
  const contactDetailPatch: CuratedPlaceEnhancementMergeResult["contactDetailPatch"] =
    {};

  const nextName = trimToNull(payload.name);
  if (nextName && nextName !== candidate.place.name) {
    placePatch.name = nextName;
  }

  const nextAddress = trimToNull(payload.address);
  if (nextAddress && nextAddress !== candidate.place.address) {
    placePatch.address = nextAddress;
  }

  const currentContact = candidate.contactDetail;
  const nextWebsite = trimToNull(payload.websiteUrl);
  if (nextWebsite && nextWebsite !== currentContact?.websiteUrl) {
    contactDetailPatch.websiteUrl = nextWebsite;
  }

  const nextFacebook = trimToNull(payload.facebookUrl);
  if (nextFacebook && nextFacebook !== currentContact?.facebookUrl) {
    contactDetailPatch.facebookUrl = nextFacebook;
  }

  const nextInstagram = trimToNull(payload.instagramUrl);
  if (nextInstagram && nextInstagram !== currentContact?.instagramUrl) {
    contactDetailPatch.instagramUrl = nextInstagram;
  }

  const nextViber = trimToNull(payload.viberInfo);
  if (nextViber && nextViber !== currentContact?.viberInfo) {
    contactDetailPatch.viberInfo = nextViber;
  }

  const nextOtherContact = trimToNull(payload.otherContactInfo);
  if (
    nextOtherContact &&
    nextOtherContact !== currentContact?.otherContactInfo
  ) {
    contactDetailPatch.otherContactInfo = nextOtherContact;
  }

  const amenities = mergeAmenityOptions(candidate.amenities, payload.amenities);
  const photoUrlsToAdd = payload.photoUrls.filter(
    (url) => !candidate.photoUrls.includes(url),
  );

  const activeCourts = candidate.courts.filter((court) => court.isActive);
  const activeSportId = activeCourts[0]?.sportId ?? null;
  const desiredCount =
    payload.desiredCourtCount && payload.desiredCourtCount > 0
      ? payload.desiredCourtCount
      : null;

  let courtPlan: CuratedPlaceEnhancementMergeResult["courtPlan"] = {
    mode: "none",
    desiredCount,
    sportId: activeSportId,
  };
  if (desiredCount && activeSportId) {
    const allGeneric =
      activeCourts.length > 0 &&
      activeCourts.every((court) => isAutogeneratedCourtLabel(court.label));

    if (allGeneric && activeCourts.length !== desiredCount) {
      courtPlan = {
        mode: "sync-generic",
        desiredCount,
        sportId: activeSportId,
      };
    } else if (!allGeneric) {
      courtPlan = {
        mode: "skip-customized",
        desiredCount,
        sportId: activeSportId,
      };
    }
  }

  const hasChanges =
    Object.keys(placePatch).length > 0 ||
    Object.keys(contactDetailPatch).length > 0 ||
    !arraysMatch(amenities, candidate.amenities) ||
    photoUrlsToAdd.length > 0 ||
    courtPlan.mode === "sync-generic";

  return {
    placePatch,
    contactDetailPatch,
    amenities,
    photoUrlsToAdd,
    courtPlan,
    hasChanges,
  };
}

export class CuratedPlaceEnhancementService {
  constructor(
    private repository: CuratedPlaceEnhancementRepository,
    private providers: CuratedPlaceEnhancementProviders,
    private judge: CuratedPlaceEnhancementJudge,
  ) {}

  async enhanceEligiblePlaces(
    options: CuratedPlaceEnhancementOptions & { limit?: number | null } = {},
  ): Promise<CuratedPlaceEnhancementBatchResult> {
    const candidates = await this.repository.listEligibleCandidates({
      limit: options.limit ?? null,
      sourceMode: options.sourceMode ?? "auto",
      retryFailed: options.retryFailed ?? false,
      retryReviewRequired: options.retryReviewRequired ?? false,
    });

    return this.enhanceCandidates(candidates, options);
  }

  async enhancePlacesByIds(
    placeIds: string[],
    options: CuratedPlaceEnhancementOptions = {},
  ): Promise<CuratedPlaceEnhancementBatchResult> {
    if (placeIds.length === 0) {
      return {
        processedPlaceIds: [],
        changedPlaceIds: [],
        skippedPlaceIds: [],
        reviewedPlaceIds: [],
        reviews: [],
      };
    }

    const candidates = await this.repository.findCandidatesByIds(placeIds);
    return this.enhanceCandidates(candidates, options);
  }

  private async enhanceCandidates(
    candidates: CuratedPlaceEnhancementCandidate[],
    options: CuratedPlaceEnhancementOptions,
  ): Promise<CuratedPlaceEnhancementBatchResult> {
    const results = await Promise.all(
      candidates.map((candidate) => this.enhanceCandidate(candidate, options)),
    );

    return {
      processedPlaceIds: results.map((result) => result.placeId),
      changedPlaceIds: results
        .filter((result) => result.changed)
        .map((result) => result.placeId),
      skippedPlaceIds: results
        .filter(
          (result) =>
            !result.website && !result.facebook && result.review === null,
        )
        .map((result) => result.placeId),
      reviewedPlaceIds: results
        .filter((result) => result.review !== null)
        .map((result) => result.placeId),
      reviews: results
        .map((result) => result.review)
        .filter(
          (item): item is CuratedPlaceEnhancementReviewRecord => item !== null,
        ),
    };
  }

  private async judgeExtraction(
    candidate: CuratedPlaceEnhancementCandidate,
    extraction: CuratedPlaceEnhancementExtraction,
    attemptedAt: string,
  ) {
    const judgement = await this.judge.judge({
      candidate,
      extraction,
    });

    if (judgement.decision === "review") {
      return {
        approvedPayload: null,
        review: buildReviewRecord({
          candidate,
          extraction,
          judgement,
        }),
        reviewOutcome: buildReviewRequiredOutcome(
          attemptedAt,
          judgement.summary,
        ),
      };
    }

    return {
      approvedPayload: judgement.improvedPayload,
      review: null,
      reviewOutcome: null,
    };
  }

  private async enhanceCandidate(
    candidate: CuratedPlaceEnhancementCandidate,
    options: CuratedPlaceEnhancementOptions,
  ): Promise<CuratedPlaceEnhancementResult> {
    const sourceMode = options.sourceMode ?? "auto";
    const sportSlug = options.sportSlug ?? "pickleball";
    const websiteUrl = candidate.contactDetail?.websiteUrl ?? null;
    const facebookUrl = candidate.contactDetail?.facebookUrl ?? null;

    let websiteOutcome: SourceEnhancementOutcome | null = null;
    let facebookOutcome: SourceEnhancementOutcome | null = null;
    let approvedPayload: CuratedPlaceEnhancementPayload | null = null;
    let review: CuratedPlaceEnhancementReviewRecord | null = null;

    const shouldTryWebsite =
      sourceMode !== "facebook" &&
      Boolean(websiteUrl) &&
      !isSourceCompleted(candidate.place.websiteEnhancementStatus, options);
    const shouldTryFacebookDirect =
      sourceMode === "facebook" &&
      Boolean(facebookUrl) &&
      !isSourceCompleted(candidate.place.facebookEnhancementStatus, options);

    if (shouldTryWebsite && websiteUrl) {
      const attemptedAt = new Date().toISOString();
      try {
        const extraction = await this.providers.enhanceFromWebsite({
          placeId: candidate.place.id,
          sportSlug,
          url: websiteUrl,
        });
        if (!extraction) {
          websiteOutcome = buildFailedOutcome(
            attemptedAt,
            "No usable website enhancement payload",
          );
        } else {
          const judged = await this.judgeExtraction(
            candidate,
            extraction,
            attemptedAt,
          );
          approvedPayload = judged.approvedPayload;
          review = judged.review;
          websiteOutcome =
            judged.reviewOutcome ?? buildCompletedOutcome(attemptedAt);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown website enhancement error";
        websiteOutcome = buildFailedOutcome(attemptedAt, message);
      }
    }

    const shouldFallbackToFacebook =
      sourceMode === "auto" &&
      !approvedPayload &&
      review === null &&
      Boolean(facebookUrl) &&
      !isSourceCompleted(candidate.place.facebookEnhancementStatus, options) &&
      ((shouldTryWebsite && websiteOutcome?.status === "FAILED") ||
        !websiteUrl);

    if ((shouldTryFacebookDirect || shouldFallbackToFacebook) && facebookUrl) {
      const attemptedAt = new Date().toISOString();
      try {
        const extraction = await this.providers.enhanceFromFacebook({
          city: candidate.place.city,
          placeId: candidate.place.id,
          province: candidate.place.province,
          sportSlug,
          url: facebookUrl,
        });
        if (!extraction) {
          facebookOutcome = buildFailedOutcome(
            attemptedAt,
            "No usable Facebook enhancement payload",
          );
        } else {
          const judged = await this.judgeExtraction(
            candidate,
            extraction,
            attemptedAt,
          );
          approvedPayload = judged.approvedPayload;
          review = judged.review;
          facebookOutcome =
            judged.reviewOutcome ?? buildCompletedOutcome(attemptedAt);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown Facebook enhancement error";
        facebookOutcome = buildFailedOutcome(attemptedAt, message);
      }
    }

    if (
      !websiteOutcome &&
      sourceMode === "website" &&
      !websiteUrl &&
      !isSourceCompleted(candidate.place.websiteEnhancementStatus, options)
    ) {
      websiteOutcome = buildSkippedOutcome(new Date().toISOString());
    }
    if (
      !facebookOutcome &&
      sourceMode === "facebook" &&
      !facebookUrl &&
      !isSourceCompleted(candidate.place.facebookEnhancementStatus, options)
    ) {
      facebookOutcome = buildSkippedOutcome(new Date().toISOString());
    }

    const mergedRecord = approvedPayload
      ? mergeEnhancementPayloadIntoCandidate(candidate, approvedPayload)
      : null;
    const persisted = await this.repository.persistOutcome({
      placeId: candidate.place.id,
      mergedPayload: approvedPayload,
      mergedRecord,
      website: websiteOutcome,
      facebook: facebookOutcome,
    });

    return {
      placeId: candidate.place.id,
      changed: persisted.changed,
      website: websiteOutcome,
      facebook: facebookOutcome,
      review,
    };
  }
}
