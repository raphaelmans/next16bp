import { z } from "zod";
import { S } from "@/common/schemas";

const COACH_SKILL_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "COMPETITIVE",
] as const;
const COACH_AGE_GROUPS = ["KIDS", "TEENS", "ADULTS", "SENIORS"] as const;
const COACH_SESSION_TYPES = ["PRIVATE", "SEMI_PRIVATE", "GROUP"] as const;
const COACH_SESSION_DURATIONS = [30, 60, 90, 120] as const;

const CoachCertificationInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  issuingBody: z.string().trim().max(200).optional(),
  level: z.string().trim().max(100).optional(),
});

const CoachBaseInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: S.common.slug.optional(),
  tagline: z.string().trim().max(300).optional(),
  bio: z.string().trim().max(5000).optional(),
  introVideoUrl: S.common.url().optional(),
  yearsOfExperience: z.number().int().min(0).max(100).optional(),
  playingBackground: z.string().trim().max(5000).optional(),
  coachingPhilosophy: z.string().trim().max(5000).optional(),
  city: z.string().trim().max(100).optional(),
  province: z.string().trim().max(100).optional(),
  latitude: S.common.coordinateString.latitude,
  longitude: S.common.coordinateString.longitude,
  timeZone: z.string().trim().min(1).max(64).optional(),
  willingToTravel: z.boolean().optional(),
  onlineCoaching: z.boolean().optional(),
  baseHourlyRateCents: z.number().int().min(0).optional(),
  baseHourlyRateCurrency: z.string().trim().length(3).optional(),
  phoneNumber: S.profile.phoneNumber,
  facebookUrl: S.common.url().optional(),
  instagramUrl: S.common.url().optional(),
  websiteUrl: S.common.url().optional(),
  sportIds: z.array(S.ids.sportId).default([]),
  certifications: z.array(CoachCertificationInputSchema).default([]),
  specialties: z.array(z.string().trim().min(1).max(100)).default([]),
  skillLevels: z.array(z.enum(COACH_SKILL_LEVELS)).default([]),
  ageGroups: z.array(z.enum(COACH_AGE_GROUPS)).default([]),
  sessionTypes: z.array(z.enum(COACH_SESSION_TYPES)).default([]),
  sessionDurations: z
    .array(z.union(COACH_SESSION_DURATIONS.map((value) => z.literal(value))))
    .default([]),
});

export const CreateCoachSchema = CoachBaseInputSchema;

export const UpdateCoachSchema = CoachBaseInputSchema.partial();

export const ListCoachesSchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  province: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  sportId: S.ids.sportId.optional(),
  minRate: z.number().int().min(0).optional(),
  maxRate: z.number().int().min(0).optional(),
  minRating: z.number().min(0).max(5).optional(),
  skillLevel: z.enum(COACH_SKILL_LEVELS).optional(),
  ageGroup: z.enum(COACH_AGE_GROUPS).optional(),
  sessionType: z.enum(COACH_SESSION_TYPES).optional(),
  verified: z.boolean().optional(),
  venueId: S.ids.placeId.optional(),
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export const ListCoachCardMediaSchema = z.object({
  coachIds: z.array(S.ids.coachId),
});

export const ListCoachCardMetaSchema = z.object({
  coachIds: z.array(S.ids.coachId),
});

export const GetCoachByIdOrSlugSchema = z.object({
  coachIdOrSlug: z.string().trim().min(1).max(200),
});

export type CreateCoachDTO = z.infer<typeof CreateCoachSchema>;
export type UpdateCoachDTO = z.infer<typeof UpdateCoachSchema>;
export type ListCoachesDTO = z.infer<typeof ListCoachesSchema>;
export type ListCoachCardMediaDTO = z.infer<typeof ListCoachCardMediaSchema>;
export type ListCoachCardMetaDTO = z.infer<typeof ListCoachCardMetaSchema>;
export type GetCoachByIdOrSlugDTO = z.infer<typeof GetCoachByIdOrSlugSchema>;
export type CoachCertificationInput = z.infer<
  typeof CoachCertificationInputSchema
>;
