import "server-only";

import { unstable_cache } from "next/cache";
import CourtsPageClient from "@/features/discovery/components/courts-page-client";
import type {
  PublicCourtsPageData,
  PublicDiscoveryPlaceCardMedia,
  PublicDiscoveryPlaceCardMeta,
  PublicDiscoveryPlaceSummary,
} from "@/features/discovery/public-courts-data";
import {
  buildDiscoveryPlaceListSummaryQueryInput,
  buildDiscoveryTier1CacheTags,
  DISCOVERY_SUMMARIES_DEFAULT_LIMIT,
  DISCOVERY_TIER1_REVALIDATE_SECONDS,
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
  limit: parsePositiveInt(
    getFirstValue(searchParams?.limit),
    DISCOVERY_SUMMARIES_DEFAULT_LIMIT,
  ),
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

const getCachedDiscoveryPlaceCardMedia = async (
  placeIds: string[],
  location: DiscoveryResolvedLocation,
) => {
  const cacheKey = JSON.stringify(placeIds);
  const tags = buildDiscoveryTier1CacheTags(location);

  const cachedQuery = unstable_cache(
    async () => publicCaller.place.cardMediaByIds({ placeIds }),
    ["discovery", "place-card-media", cacheKey],
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

const getDiscoveryPlaceCardMedia = async (
  placeIds: string[],
  location: DiscoveryResolvedLocation,
) => {
  if (placeIds.length === 0) {
    return [];
  }

  return getCachedDiscoveryPlaceCardMedia(placeIds, location);
};

const mapSummaryMeta = (meta?: {
  sports: { id: string; slug: string; name: string }[];
  courtCount: number;
  lowestPriceCents: number | null;
  currency: string | null;
  verificationStatus?: string | null;
  reservationsEnabled?: boolean | null;
  hasPaymentMethods?: boolean;
  averageRating?: number | null;
  reviewCount?: number | null;
}): PublicDiscoveryPlaceCardMeta | undefined => {
  if (!meta) return undefined;
  return {
    sports: meta.sports,
    courtCount: meta.courtCount,
    lowestPriceCents: meta.lowestPriceCents ?? undefined,
    currency: meta.currency ?? undefined,
    verificationStatus:
      (meta.verificationStatus as PublicDiscoveryPlaceCardMeta["verificationStatus"]) ??
      undefined,
    reservationsEnabled: meta.reservationsEnabled ?? undefined,
    hasPaymentMethods: meta.hasPaymentMethods,
    averageRating: meta.averageRating,
    reviewCount: meta.reviewCount,
  };
};

const mapSummaryItem = (item: {
  place: {
    id: string;
    slug?: string | null;
    name: string;
    address: string;
    city: string;
    latitude: string | null;
    longitude: string | null;
    placeType?: "CURATED" | "RESERVABLE";
    featuredRank?: number | null;
    provinceRank?: number | null;
  };
  availabilityPreview?: PublicDiscoveryPlaceSummary["availabilityPreview"];
  meta?: Parameters<typeof mapSummaryMeta>[0];
}): PublicDiscoveryPlaceSummary => {
  const latitude = Number.parseFloat(item.place.latitude ?? "");
  const longitude = Number.parseFloat(item.place.longitude ?? "");

  return {
    id: item.place.id,
    slug: item.place.slug ?? undefined,
    name: item.place.name,
    address: item.place.address,
    city: item.place.city,
    placeType: item.place.placeType,
    featuredRank: item.place.featuredRank ?? 0,
    provinceRank: item.place.provinceRank ?? 0,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    availabilityPreview: item.availabilityPreview,
    meta: mapSummaryMeta(item.meta),
  };
};

const mapMediaById = (
  items: {
    placeId: string;
    coverImageUrl?: string | null;
    organizationLogoUrl?: string | null;
  }[],
) =>
  Object.fromEntries(
    items.map((item) => [
      item.placeId,
      {
        coverImageUrl: item.coverImageUrl ?? undefined,
        organizationLogoUrl: item.organizationLogoUrl ?? undefined,
      } satisfies PublicDiscoveryPlaceCardMedia,
    ]),
  );

const buildPublicCourtsPageData = async (args: {
  summaryInput: ReturnType<typeof buildDiscoveryPlaceListSummaryQueryInput>;
  resolvedLocation: DiscoveryResolvedLocation;
  page: number;
}) => {
  const summaryResult = await getDiscoveryPlaceSummaries(
    args.summaryInput,
    args.resolvedLocation,
  );
  const places = summaryResult.items.map(mapSummaryItem);
  const placeIds = places.map((place) => place.id);

  const mediaItems = await getDiscoveryPlaceCardMedia(
    placeIds,
    args.resolvedLocation,
  );

  return {
    places,
    mediaById: mapMediaById(mediaItems),
    total: summaryResult.total,
    page: args.page,
    limit: args.summaryInput.limit,
    hasMore:
      args.summaryInput.offset + summaryResult.items.length <
      summaryResult.total,
  } satisfies PublicCourtsPageData;
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
  const prefetchState = await resolveDiscoveryPrefetchState({
    searchParams,
    initialFilters,
  });
  const initialData = await buildPublicCourtsPageData({
    summaryInput: prefetchState.summaryInput,
    resolvedLocation: prefetchState.resolvedLocation,
    page: prefetchState.effectiveFilters.page ?? 1,
  });

  return (
    <CourtsPageClient
      initialData={initialData}
      initialFilters={initialFilters}
      initialLocationLabel={initialLocationLabel}
      initialResolvedLocation={prefetchState.resolvedLocation}
    />
  );
}
