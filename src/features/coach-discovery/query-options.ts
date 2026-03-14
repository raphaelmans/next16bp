import type {
  COACH_AGE_GROUP_VALUES,
  COACH_SESSION_TYPE_VALUES,
  COACH_SKILL_LEVEL_VALUES,
} from "./schemas";

export const COACH_DISCOVERY_DEFAULT_PAGE = 1;
export const COACH_DISCOVERY_DEFAULT_LIMIT = 12;
export const COACH_DISCOVERY_REVALIDATE_SECONDS = 6 * 60 * 60;

export type CoachSkillLevelFilter = (typeof COACH_SKILL_LEVEL_VALUES)[number];
export type CoachAgeGroupFilter = (typeof COACH_AGE_GROUP_VALUES)[number];
export type CoachSessionTypeFilter = (typeof COACH_SESSION_TYPE_VALUES)[number];

export type CoachResolvedLocationState = {
  provinceSlug?: string;
  citySlug?: string;
  provinceName?: string;
  cityName?: string;
};

export type CoachListFilterState = {
  q?: string;
  province?: string;
  city?: string;
  sportId?: string;
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  skillLevel?: CoachSkillLevelFilter;
  ageGroup?: CoachAgeGroupFilter;
  sessionType?: CoachSessionTypeFilter;
  verified?: boolean;
  page?: number;
  limit?: number;
};

export type CoachListSummaryQueryInput = {
  q?: string;
  province?: string;
  city?: string;
  sportId?: string;
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  skillLevel?: CoachSkillLevelFilter;
  ageGroup?: CoachAgeGroupFilter;
  sessionType?: CoachSessionTypeFilter;
  verified?: boolean;
  limit: number;
  offset: number;
};

const normalizeString = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const normalizeNonNegativeInteger = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : undefined;

const normalizeRating = (value?: number | null) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 5
    ? value
    : undefined;

const normalizeTagToken = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : "all";
};

export const buildCoachListSummaryQueryInput = (
  input: CoachListFilterState,
): CoachListSummaryQueryInput => {
  const limit =
    input.limit && input.limit > 0
      ? input.limit
      : COACH_DISCOVERY_DEFAULT_LIMIT;
  const page =
    input.page && input.page > 0 ? input.page : COACH_DISCOVERY_DEFAULT_PAGE;

  const minRate = normalizeNonNegativeInteger(input.minRate);
  const maxRate = normalizeNonNegativeInteger(input.maxRate);

  return {
    q: normalizeString(input.q),
    province: normalizeString(input.province),
    city: normalizeString(input.city),
    sportId: normalizeString(input.sportId),
    minRate: minRate !== undefined ? minRate * 100 : undefined,
    maxRate: maxRate !== undefined ? maxRate * 100 : undefined,
    minRating: normalizeRating(input.minRating),
    skillLevel: input.skillLevel,
    ageGroup: input.ageGroup,
    sessionType: input.sessionType,
    verified: input.verified ? true : undefined,
    limit,
    offset: (page - 1) * limit,
  };
};

export const buildCoachDiscoveryCacheTags = (
  input?: CoachResolvedLocationState,
) => {
  const provinceSlug = normalizeTagToken(input?.provinceSlug);
  const citySlug = normalizeTagToken(input?.citySlug);

  return [
    "discovery:coaches:list",
    `discovery:coaches:province:${provinceSlug}`,
    `discovery:coaches:city:${provinceSlug}:${citySlug}`,
  ];
};
