import type {
  CoachAgeGroupFilter,
  CoachResolvedLocationState,
  CoachSessionTypeFilter,
  CoachSkillLevelFilter,
} from "./query-options";

export interface PublicDiscoveryCoachCardMedia {
  avatarUrl?: string;
  primaryPhotoUrl?: string;
}

export interface PublicDiscoveryCoachSummaryMeta {
  sports: { id: string; name: string; slug: string }[];
  sessionTypes: CoachSessionTypeFilter[];
  averageRating?: number | null;
  reviewCount?: number;
  verified: boolean;
}

export interface PublicDiscoveryCoachSummary {
  id: string;
  slug?: string;
  name: string;
  tagline?: string;
  city?: string;
  province?: string;
  baseHourlyRateCents?: number;
  currency?: string;
  featuredRank: number;
  provinceRank: number;
  meta?: PublicDiscoveryCoachSummaryMeta;
}

export interface PublicCoachDiscoveryStats {
  totalCoaches: number;
  totalCities: number;
  totalSports: number;
}

export interface PublicCoachesPageData {
  coaches: PublicDiscoveryCoachSummary[];
  mediaById: Record<string, PublicDiscoveryCoachCardMedia>;
  stats: PublicCoachDiscoveryStats;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type PublicCoachResolvedLocation = CoachResolvedLocationState;

export type CoachDiscoveryFilterChip = {
  key:
    | "q"
    | "province"
    | "city"
    | "sportId"
    | "minRate"
    | "maxRate"
    | "minRating"
    | "skillLevel"
    | "ageGroup"
    | "sessionType"
    | "verified";
  label: string;
};

export type CoachFilterValue =
  | string
  | number
  | boolean
  | CoachSkillLevelFilter
  | CoachAgeGroupFilter
  | CoachSessionTypeFilter;
