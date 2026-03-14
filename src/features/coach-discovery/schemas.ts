import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const COACH_SKILL_LEVEL_VALUES = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "COMPETITIVE",
] as const;

export const COACH_AGE_GROUP_VALUES = [
  "KIDS",
  "TEENS",
  "ADULTS",
  "SENIORS",
] as const;

export const COACH_SESSION_TYPE_VALUES = [
  "PRIVATE",
  "SEMI_PRIVATE",
  "GROUP",
] as const;

export const coachSearchParamsSchema = {
  q: parseAsString,
  province: parseAsString,
  city: parseAsString,
  sportId: parseAsString,
  minRate: parseAsInteger,
  maxRate: parseAsInteger,
  minRating: parseAsInteger,
  skillLevel: parseAsStringLiteral(COACH_SKILL_LEVEL_VALUES),
  ageGroup: parseAsStringLiteral(COACH_AGE_GROUP_VALUES),
  sessionType: parseAsStringLiteral(COACH_SESSION_TYPE_VALUES),
  verified: parseAsBoolean,
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(12),
};

export const coachSearchParamsCache = createSearchParamsCache(
  coachSearchParamsSchema,
);

export type CoachSearchParams = {
  q: string | null;
  province: string | null;
  city: string | null;
  sportId: string | null;
  minRate: number | null;
  maxRate: number | null;
  minRating: number | null;
  skillLevel: (typeof COACH_SKILL_LEVEL_VALUES)[number] | null;
  ageGroup: (typeof COACH_AGE_GROUP_VALUES)[number] | null;
  sessionType: (typeof COACH_SESSION_TYPE_VALUES)[number] | null;
  verified: boolean | null;
  page: number;
  limit: number;
};
