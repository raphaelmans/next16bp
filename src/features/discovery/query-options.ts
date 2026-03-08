import { queryOptions, type UseQueryOptions } from "@tanstack/react-query";
import { normalizeAmenityValues } from "@/common/amenities";
import type { AppError } from "@/common/errors/app-error";
import { buildTrpcQueryKey } from "@/common/trpc-query-key";

export const DISCOVERY_SUMMARIES_DEFAULT_PAGE = 1;
export const DISCOVERY_SUMMARIES_DEFAULT_LIMIT = 8;
export const DISCOVERY_TIER1_STALE_TIME_MS = 7 * 24 * 60 * 60 * 1000;
export const DISCOVERY_TIER1_REVALIDATE_SECONDS = 7 * 24 * 60 * 60;
export const DISCOVERY_AVAILABILITY_STALE_TIME_MS = 30 * 1000;
export const DISCOVERY_TIER2_STALE_TIME_MS = 5 * 60 * 1000;
export const DISCOVERY_VISIBLE_CHUNK_SIZE = 4;

export type DiscoveryVerificationTier =
  | "verified_reservable"
  | "curated"
  | "unverified_reservable";

export type DiscoveryListFilterState = {
  q?: string;
  province?: string;
  city?: string;
  sportId?: string;
  date?: string;
  time?: string[];
  amenities?: string[];
  verificationTier?: DiscoveryVerificationTier;
  page?: number;
  limit?: number;
};

export type DiscoveryResolvedLocationState = {
  provinceSlug?: string;
  citySlug?: string;
  provinceName?: string;
  cityName?: string;
};

export type DiscoveryPlaceListSummaryQueryInput = {
  q?: string;
  province?: string;
  city?: string;
  sportId?: string;
  date?: string;
  time?: string[];
  amenities?: string[];
  verificationTier?: DiscoveryVerificationTier;
  limit: number;
  offset: number;
};

export type DiscoveryAvailabilityPreview = {
  requestedDate: string;
  requestedTime?: string[];
  matchedStartTime: string;
  matchCount: number;
  timeZone: string;
  sportName?: string;
  sportId?: string;
};

export type DiscoveryAvailabilityInput = {
  date?: string;
  time?: string[];
};

type DiscoveryQueryOptions<TQueryFnData, TData = TQueryFnData> = Omit<
  UseQueryOptions<
    TQueryFnData,
    AppError,
    TData,
    ReturnType<typeof buildTrpcQueryKey>
  >,
  "queryKey" | "queryFn"
>;

const normalizeString = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_KEY_PATTERN = /^\d{2}:\d{2}$/;

export const normalizeDiscoveryAvailabilityInput = (input: {
  sportId?: string;
  date?: string | null;
  time?: string[] | null;
}): DiscoveryAvailabilityInput => {
  const date = normalizeString(input.date);

  if (!date || !DAY_KEY_PATTERN.test(date)) {
    return {};
  }

  const validTimes = (input.time ?? [])
    .map((t) => t.trim())
    .filter((t) => TIME_KEY_PATTERN.test(t));

  return {
    date,
    time: validTimes.length > 0 ? validTimes : undefined,
  };
};

export const buildDiscoveryPlaceListSummaryQueryInput = (input: {
  q?: string;
  provinceName?: string;
  cityName?: string;
  sportId?: string;
  date?: string;
  time?: string[];
  amenities?: string[];
  verificationTier?: DiscoveryVerificationTier;
  page?: number;
  limit?: number;
}): DiscoveryPlaceListSummaryQueryInput => {
  const limit =
    input.limit && input.limit > 0
      ? input.limit
      : DISCOVERY_SUMMARIES_DEFAULT_LIMIT;
  const page =
    input.page && input.page > 0
      ? input.page
      : DISCOVERY_SUMMARIES_DEFAULT_PAGE;

  const availability = normalizeDiscoveryAvailabilityInput({
    sportId: input.sportId,
    date: input.date,
    time: input.time,
  });

  return {
    q: normalizeString(input.q),
    province: normalizeString(input.provinceName),
    city: normalizeString(input.cityName),
    sportId: normalizeString(input.sportId),
    date: availability.date,
    time: availability.time,
    amenities:
      input.amenities && input.amenities.length > 0
        ? normalizeAmenityValues(input.amenities)
        : undefined,
    verificationTier: input.verificationTier,
    limit,
    offset: (page - 1) * limit,
  };
};

export const createDiscoveryPlaceSummariesQueryOptions = <
  TOutput extends { items: unknown[]; total: number },
>(
  queryFn: (input: DiscoveryPlaceListSummaryQueryInput) => Promise<TOutput>,
  input: DiscoveryPlaceListSummaryQueryInput,
  options?: DiscoveryQueryOptions<TOutput>,
) =>
  queryOptions({
    queryKey: buildTrpcQueryKey(["place", "listSummary"], input),
    queryFn: () => queryFn(input),
    ...options,
  });

export const createDiscoveryPlaceCardMediaQueryOptions = <
  TOutput extends { placeId: string }[],
>(
  queryFn: (input: { placeIds: string[] }) => Promise<TOutput>,
  input: { placeIds: string[] },
  options?: DiscoveryQueryOptions<TOutput>,
) =>
  queryOptions({
    queryKey: buildTrpcQueryKey(["place", "cardMediaByIds"], input),
    queryFn: () => queryFn(input),
    ...options,
  });

export const createDiscoveryPlaceCardMetaQueryOptions = <
  TOutput extends { placeId: string }[],
>(
  queryFn: (input: {
    placeIds: string[];
    sportId?: string;
  }) => Promise<TOutput>,
  input: { placeIds: string[]; sportId?: string },
  options?: DiscoveryQueryOptions<TOutput>,
) =>
  queryOptions({
    queryKey: buildTrpcQueryKey(["place", "cardMetaByIds"], input),
    queryFn: () => queryFn(input),
    ...options,
  });

const normalizeTagToken = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : "all";
};

export const buildDiscoveryTier1CacheTags = (input?: {
  provinceSlug?: string | null;
  citySlug?: string | null;
}) => {
  const provinceSlug = normalizeTagToken(input?.provinceSlug);
  const citySlug = normalizeTagToken(input?.citySlug);

  return [
    "discovery:courts:list",
    `discovery:courts:province:${provinceSlug}`,
    `discovery:courts:city:${provinceSlug}:${citySlug}`,
  ];
};
