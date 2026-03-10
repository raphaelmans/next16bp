import { z } from "zod";

export const PlaceListingTrackingBucketSchema = z.enum([
  "curated_place",
  "org_created_place",
]);

export const PlaceListingLabelSchema = z.enum(["keep", "review", "remove"]);

export const PlaceListingConfidenceSchema = z.enum(["high", "medium", "low"]);

export const PlaceListingReasonCodeSchema = z.enum([
  "looks_valid",
  "nonprod_or_test",
  "missing_trust_signal",
  "generic_or_placeholder",
  "missing_location",
  "possible_duplicate",
  "needs_manual_review",
]);

export const PlaceListingBaselineFlagSchema = z.enum([
  "nonprod_slug",
  "generic_slug",
  "generic_name",
  "missing_location",
  "missing_trust_signal",
  "no_active_courts",
]);

export const PlaceTypeSchema = z.enum(["CURATED", "RESERVABLE"]);

export const PlaceListingEvidenceSchema = z.object({
  placeId: z.string().uuid(),
  trackingBucket: PlaceListingTrackingBucketSchema,
  placeType: PlaceTypeSchema,
  organizationId: z.string().uuid().nullable(),
  slug: z.string().min(1),
  name: z.string().min(1),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  country: z.string().length(2),
  claimStatus: z.enum([
    "UNCLAIMED",
    "CLAIM_PENDING",
    "CLAIMED",
    "REMOVAL_REQUESTED",
  ]),
  verificationStatus: z.string(),
  activeCourtCount: z.number().int().nonnegative(),
  activeCourtLabels: z.array(z.string()),
  activeSports: z.array(z.string()),
  photoCount: z.number().int().nonnegative(),
  hasContactDetails: z.boolean(),
  baselineFlags: z.array(PlaceListingBaselineFlagSchema),
  baselineSuggestion: z.object({
    label: PlaceListingLabelSchema,
    reasonCode: PlaceListingReasonCodeSchema,
  }),
});

export const PlaceListingDecisionSchema = z.object({
  placeId: z.string().uuid(),
  trackingBucket: PlaceListingTrackingBucketSchema,
  label: PlaceListingLabelSchema,
  confidence: PlaceListingConfidenceSchema,
  reasonCode: PlaceListingReasonCodeSchema,
  reasonSummary: z.string().min(1).max(240),
});

export const PlaceListingDecisionBatchSchema = z.object({
  decisions: z.array(PlaceListingDecisionSchema),
});

export const PlaceListingSummaryRowSchema = z.object({
  trackingBucket: PlaceListingTrackingBucketSchema,
  activePlaces: z.number().int().nonnegative(),
  keepCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  removeCount: z.number().int().nonnegative(),
  baselineFlagCounts: z.record(
    PlaceListingBaselineFlagSchema,
    z.number().int().nonnegative(),
  ),
});

export const PlaceListingVerifierReportSchema = z.object({
  generatedAt: z.string().datetime(),
  envLabel: z.string().min(1),
  model: z.string().min(1),
  batchSize: z.number().int().positive(),
  totalPlaces: z.number().int().nonnegative(),
  summaries: z.array(PlaceListingSummaryRowSchema),
  labelCounts: z.record(
    PlaceListingLabelSchema,
    z.number().int().nonnegative(),
  ),
  reasonCounts: z.record(
    PlaceListingReasonCodeSchema,
    z.number().int().nonnegative(),
  ),
  results: z.array(
    z.object({
      evidence: PlaceListingEvidenceSchema,
      decision: PlaceListingDecisionSchema,
    }),
  ),
});

export const PlaceListingFixtureCaseSchema = z.object({
  evidence: PlaceListingEvidenceSchema,
  expected: z.object({
    label: PlaceListingLabelSchema,
    reasonCode: PlaceListingReasonCodeSchema,
  }),
});

export const PlaceListingFixtureSchema = z.object({
  fixtureName: z.string().min(1),
  cases: z.array(PlaceListingFixtureCaseSchema).min(1),
});

export type PlaceListingTrackingBucket = z.infer<
  typeof PlaceListingTrackingBucketSchema
>;
export type PlaceListingLabel = z.infer<typeof PlaceListingLabelSchema>;
export type PlaceListingConfidence = z.infer<
  typeof PlaceListingConfidenceSchema
>;
export type PlaceListingReasonCode = z.infer<
  typeof PlaceListingReasonCodeSchema
>;
export type PlaceListingBaselineFlag = z.infer<
  typeof PlaceListingBaselineFlagSchema
>;
export type PlaceListingEvidence = z.infer<typeof PlaceListingEvidenceSchema>;
export type PlaceListingDecision = z.infer<typeof PlaceListingDecisionSchema>;
export type PlaceListingVerifierReport = z.infer<
  typeof PlaceListingVerifierReportSchema
>;
export type PlaceListingFixture = z.infer<typeof PlaceListingFixtureSchema>;
