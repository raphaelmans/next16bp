import { z } from "zod";

export const PlaceEnhancementStatusSchema = z.enum([
  "NOT_STARTED",
  "COMPLETED",
  "FAILED",
  "SKIPPED",
  "REVIEW_REQUIRED",
]);

export const CuratedPlaceEnhancementPayloadSchema = z.object({
  name: z.string().nullable(),
  address: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  facebookUrl: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  viberInfo: z.string().nullable(),
  otherContactInfo: z.string().nullable(),
  amenities: z.array(z.string()),
  photoUrls: z.array(z.string()),
  desiredCourtCount: z.number().int().positive().nullable(),
});

export const CuratedPlaceEnhancementCandidateSchema = z.object({
  place: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().nullable(),
    address: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    country: z.string().min(1),
    timeZone: z.string().min(1),
    websiteEnhancementStatus: PlaceEnhancementStatusSchema,
    facebookEnhancementStatus: PlaceEnhancementStatusSchema,
  }),
  contactDetail: z
    .object({
      websiteUrl: z.string().nullable(),
      facebookUrl: z.string().nullable(),
      instagramUrl: z.string().nullable(),
      phoneNumber: z.string().nullable(),
      viberInfo: z.string().nullable(),
      otherContactInfo: z.string().nullable(),
    })
    .nullable(),
  amenities: z.array(z.string()),
  photoUrls: z.array(z.string()),
  courts: z.array(
    z.object({
      id: z.string().min(1),
      sportId: z.string().min(1),
      label: z.string().min(1),
      isActive: z.boolean(),
    }),
  ),
});

export const FacebookCapturedPagePayloadSchema = z.object({
  pageUrl: z.string().url(),
  title: z.string(),
  bodyText: z.string(),
  links: z.array(z.string()),
  ogTitle: z.string(),
  ogDescription: z.string(),
});

export const CuratedPlaceEnhancementCriteriaAssessmentSchema = z.object({
  venueIdentity: z.enum(["pass", "uncertain", "fail"]),
  locationScope: z.enum(["pass", "uncertain", "fail"]),
  contactQuality: z.enum(["pass", "uncertain", "fail"]),
  payloadQuality: z.enum(["pass", "uncertain", "fail"]),
});

export const CuratedPlaceEnhancementJudgementSchema = z.object({
  decision: z.enum(["approve", "review"]),
  confidence: z.enum(["high", "medium", "low"]),
  summary: z.string().min(1).max(500),
  criteria: CuratedPlaceEnhancementCriteriaAssessmentSchema,
  improvedPayload: CuratedPlaceEnhancementPayloadSchema,
});

export const CuratedPlaceEnhancementFixtureSchema = z.discriminatedUnion(
  "source",
  [
    z.object({
      fixtureName: z.string().min(1),
      source: z.literal("website"),
      candidate: CuratedPlaceEnhancementCandidateSchema,
      input: z.object({
        requestUrl: z.string().url(),
        sourceUrl: z.string().url().optional(),
        sportSlug: z.string().min(1).optional(),
        extractItem: z.record(z.string(), z.unknown()),
      }),
      expected: z.object({
        decision: CuratedPlaceEnhancementJudgementSchema.shape.decision,
        improvedPayload: CuratedPlaceEnhancementPayloadSchema,
      }),
    }),
    z.object({
      fixtureName: z.string().min(1),
      source: z.literal("facebook"),
      candidate: CuratedPlaceEnhancementCandidateSchema,
      input: z.object({
        requestUrl: z.string().url(),
        city: z.string().min(1),
        province: z.string().min(1),
        sportSlug: z.string().min(1).optional(),
        capturedPage: FacebookCapturedPagePayloadSchema,
      }),
      expected: z.object({
        decision: CuratedPlaceEnhancementJudgementSchema.shape.decision,
        improvedPayload: CuratedPlaceEnhancementPayloadSchema,
      }),
    }),
  ],
);

export const CuratedPlaceEnhancementEvalResultSchema = z.object({
  fixtureName: z.string().min(1),
  source: z.enum(["website", "facebook"]),
  matched: z.boolean(),
  mismatches: z.array(z.string()),
  actual: CuratedPlaceEnhancementJudgementSchema.nullable(),
});

export const CuratedPlaceEnhancementEvalReportSchema = z.object({
  generatedAt: z.string().datetime(),
  judgeModel: z.string().min(1),
  facebookModel: z.string().min(1),
  fixtureCount: z.number().int().nonnegative(),
  mismatchCount: z.number().int().nonnegative(),
  results: z.array(CuratedPlaceEnhancementEvalResultSchema),
});

export type CuratedPlaceEnhancementFixture = z.infer<
  typeof CuratedPlaceEnhancementFixtureSchema
>;
