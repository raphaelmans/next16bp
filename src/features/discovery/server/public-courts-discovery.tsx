import "server-only";

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { unstable_cache } from "next/cache";
import CourtsPageClient from "@/features/discovery/components/courts-page-client";
import {
  buildDiscoveryPlaceListSummaryQueryInput,
  buildDiscoveryTier1CacheTags,
  createDiscoveryPlaceSummariesQueryOptions,
  DISCOVERY_AVAILABILITY_STALE_TIME_MS,
  DISCOVERY_TIER1_REVALIDATE_SECONDS,
  DISCOVERY_TIER1_STALE_TIME_MS,
  type DiscoveryListFilterState,
  type DiscoveryVerificationTier,
} from "@/features/discovery/query-options";
import {
  getPHProvincesCities,
  resolveLocationSlugs,
} from "@/lib/shared/lib/ph-location-data.server";
import { publicCaller } from "@/trpc/server";

type RawSearchParams = Record<string, string | string[] | undefined>;

export type DiscoveryLocationDefaults = {
  province?: string;
  city?: string;
  sportId?: string;
};

type DiscoveryResolvedLocation = {
  provinceSlug?: string;
  citySlug?: string;
  provinceName?: string;
  cityName?: string;
};
const getFirstValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const getArrayValue = (value?: string | string[]) => {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  return rawValues.flatMap((entry) =>
    entry
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  );
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseVerificationTier = (
  value: string | undefined,
): DiscoveryVerificationTier | undefined => {
  switch (value) {
    case "verified_reservable":
    case "curated":
    case "unverified_reservable":
      return value;
    default:
      return undefined;
  }
};

const normalizeString = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
};

const resolveDiscoveryLocation = async (
  provinceValue?: string,
  cityValue?: string,
): Promise<DiscoveryResolvedLocation> => {
  if (!provinceValue && !cityValue) {
    return {};
  }

  const provinces = await getPHProvincesCities();
  const resolved = resolveLocationSlugs(provinces, provinceValue, cityValue);

  return {
    provinceSlug: resolved.provinceSlug ?? normalizeString(provinceValue),
    citySlug: resolved.citySlug ?? normalizeString(cityValue),
    provinceName: resolved.province?.name ?? normalizeString(provinceValue),
    cityName: resolved.city?.name ?? normalizeString(cityValue),
  };
};

export const parseDiscoverySearchParams = (
  searchParams?: RawSearchParams,
): DiscoveryListFilterState => ({
  q: normalizeString(getFirstValue(searchParams?.q)),
  province: normalizeString(getFirstValue(searchParams?.province)),
  city: normalizeString(getFirstValue(searchParams?.city)),
  sportId: normalizeString(getFirstValue(searchParams?.sportId)),
  date: normalizeString(getFirstValue(searchParams?.date)),
  time: getArrayValue(searchParams?.time),
  amenities: getArrayValue(searchParams?.amenities),
  verificationTier: parseVerificationTier(
    normalizeString(getFirstValue(searchParams?.verification)),
  ),
  page: parsePositiveInt(getFirstValue(searchParams?.page), 1),
  limit: parsePositiveInt(getFirstValue(searchParams?.limit), 12),
});

export const resolveDiscoveryPrefetchState = async (input: {
  searchParams?: RawSearchParams;
  initialFilters?: DiscoveryLocationDefaults;
}) => {
  const parsedFilters = parseDiscoverySearchParams(input.searchParams);
  const effectiveFilters = {
    ...parsedFilters,
    province: parsedFilters.province ?? input.initialFilters?.province,
    city: parsedFilters.city ?? input.initialFilters?.city,
    sportId: parsedFilters.sportId ?? input.initialFilters?.sportId,
  };

  const resolvedLocation = await resolveDiscoveryLocation(
    effectiveFilters.province,
    effectiveFilters.city,
  );
  const summaryInput = buildDiscoveryPlaceListSummaryQueryInput({
    q: effectiveFilters.q,
    provinceName: resolvedLocation.provinceName,
    cityName: resolvedLocation.cityName,
    sportId: effectiveFilters.sportId,
    date: effectiveFilters.date,
    time: effectiveFilters.time,
    amenities: effectiveFilters.amenities,
    verificationTier: effectiveFilters.verificationTier,
    page: effectiveFilters.page,
    limit: effectiveFilters.limit,
  });

  return {
    effectiveFilters,
    resolvedLocation,
    summaryInput,
  };
};

const getCachedDiscoveryPlaceSummaries = async (
  input: ReturnType<typeof buildDiscoveryPlaceListSummaryQueryInput>,
  location: DiscoveryResolvedLocation,
) => {
  const cacheKey = JSON.stringify(input);
  const tags = buildDiscoveryTier1CacheTags(location);

  const cachedQuery = unstable_cache(
    async () => publicCaller.place.listSummary(input),
    ["discovery", "place-list-summary", cacheKey],
    {
      revalidate: DISCOVERY_TIER1_REVALIDATE_SECONDS,
      tags,
    },
  );

  return cachedQuery();
};

const getDiscoveryPlaceSummaries = async (
  input: ReturnType<typeof buildDiscoveryPlaceListSummaryQueryInput>,
  location: DiscoveryResolvedLocation,
) => {
  if (input.date) {
    return publicCaller.place.listSummary(input);
  }

  return getCachedDiscoveryPlaceSummaries(input, location);
};

type DiscoveryHydratedCourtsPageProps = {
  initialFilters?: DiscoveryLocationDefaults;
  initialLocationLabel?: string;
  searchParams?: RawSearchParams;
};

export async function DiscoveryHydratedCourtsPage({
  initialFilters,
  initialLocationLabel,
  searchParams,
}: DiscoveryHydratedCourtsPageProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DISCOVERY_TIER1_STALE_TIME_MS,
      },
    },
  });

  const prefetchState = await resolveDiscoveryPrefetchState({
    searchParams,
    initialFilters,
  });

  await queryClient.prefetchQuery(
    createDiscoveryPlaceSummariesQueryOptions(
      (input) =>
        getDiscoveryPlaceSummaries(input, prefetchState.resolvedLocation),
      prefetchState.summaryInput,
      {
        staleTime: prefetchState.summaryInput.date
          ? DISCOVERY_AVAILABILITY_STALE_TIME_MS
          : DISCOVERY_TIER1_STALE_TIME_MS,
      },
    ),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CourtsPageClient
        initialFilters={initialFilters}
        initialLocationLabel={initialLocationLabel}
        initialResolvedLocation={prefetchState.resolvedLocation}
      />
    </HydrationBoundary>
  );
}
