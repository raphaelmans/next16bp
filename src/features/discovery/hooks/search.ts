"use client";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { LIVE_QUERY_OPTIONS } from "@/common/live-query-options";
import {
  findCityBySlug,
  findCityBySlugAcrossProvinces,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import {
  normalizeAvailabilityCourtDayInput,
  normalizeAvailabilityCourtRangeInput,
  normalizeAvailabilityPlaceSportRangeInput,
} from "@/common/query-keys";
import {
  mapPlaceSummary,
  type PlaceSummary,
} from "@/features/discovery/helpers";
import {
  buildDiscoveryPlaceListSummaryQueryInput,
  createDiscoveryPlaceSummariesQueryOptions,
  DISCOVERY_AVAILABILITY_STALE_TIME_MS,
  DISCOVERY_SUMMARIES_DEFAULT_LIMIT,
  DISCOVERY_TIER1_STALE_TIME_MS,
  type DiscoveryAvailabilityPreview,
  type DiscoveryResolvedLocationState,
} from "@/features/discovery/query-options";
import { getDiscoveryApi } from "../api.runtime";
import { useModDiscoveryAvailabilityRealtimeSync } from "../realtime";

const discoveryApi = getDiscoveryApi();

type DiscoveryAvailabilityForCourtInput = {
  courtId: string;
  date: string;
  durationMinutes: number;
  includeUnavailable: boolean;
  selectedAddons?: { addonId: string; quantity: number }[];
};

type DiscoveryAvailabilityForCourtRangeInput = {
  courtId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable: boolean;
  selectedAddons?: { addonId: string; quantity: number }[];
};

type DiscoveryAvailabilityForPlaceSportRangeInput = {
  placeId: string;
  sportId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable: boolean;
  includeCourtOptions: boolean;
  selectedAddons?: { addonId: string; quantity: number }[];
};

export function useQueryDiscoverySports() {
  return useFeatureQuery(
    ["sport", "list"],
    discoveryApi.querySportList,
    undefined,
  );
}

export function useQueryDiscoveryOrganizations(enabled: boolean) {
  return useFeatureQuery(
    ["organization", "my"],
    discoveryApi.queryOrganizationMy,
    undefined,
    { enabled },
  );
}

export function useMutDiscoverySubmitClaim() {
  return useFeatureMutation(discoveryApi.mutClaimRequestSubmitClaim);
}

export function useMutDiscoverySubmitGuestRemoval() {
  return useFeatureMutation(discoveryApi.mutClaimRequestSubmitGuestRemoval);
}

export function useQueryDiscoveryAvailabilityForCourt(
  input: DiscoveryAvailabilityForCourtInput,
  enabled: boolean,
) {
  const normalizedInput = normalizeAvailabilityCourtDayInput(input);
  useModDiscoveryAvailabilityRealtimeSync({
    enabled,
    courtDayInput: normalizedInput,
  });
  return useFeatureQuery(
    ["availability", "getForCourt"],
    discoveryApi.queryAvailabilityGetForCourt,
    normalizedInput,
    {
      ...LIVE_QUERY_OPTIONS,
      enabled,
      placeholderData: keepPreviousData,
    },
  );
}

export function useQueryDiscoveryAvailabilityForCourtRange(
  input: DiscoveryAvailabilityForCourtRangeInput,
  enabled: boolean,
) {
  const normalizedInput = normalizeAvailabilityCourtRangeInput(input);
  useModDiscoveryAvailabilityRealtimeSync({
    enabled,
    courtRangeInput: normalizedInput,
  });
  return useFeatureQuery(
    ["availability", "getForCourtRange"],
    discoveryApi.queryAvailabilityGetForCourtRange,
    normalizedInput,
    {
      ...LIVE_QUERY_OPTIONS,
      enabled,
      placeholderData: keepPreviousData,
    },
  );
}

export function useQueryDiscoveryAvailabilityForPlaceSportRange(
  input: DiscoveryAvailabilityForPlaceSportRangeInput,
  enabled: boolean,
) {
  const normalizedInput = normalizeAvailabilityPlaceSportRangeInput(input);
  useModDiscoveryAvailabilityRealtimeSync({
    enabled,
    placeSportRangeInput: normalizedInput,
  });
  return useFeatureQuery(
    ["availability", "getForPlaceSportRange"],
    discoveryApi.queryAvailabilityGetForPlaceSportRange,
    normalizedInput,
    {
      ...LIVE_QUERY_OPTIONS,
      enabled,
      placeholderData: keepPreviousData,
    },
  );
}

interface UseDiscoveryOptions {
  q?: string;
  province?: string;
  city?: string;
  sportId?: string;
  date?: string;
  time?: string[];
  amenities?: string[];
  verificationTier?:
    | "verified_reservable"
    | "curated"
    | "unverified_reservable";
  page?: number;
  limit?: number;
  initialResolvedLocation?: DiscoveryResolvedLocationState;
}

export interface DiscoveryPlaceSummaryMeta {
  sports: { id: string; name: string; slug: string }[];
  courtCount: number;
  lowestPriceCents: number | null;
  currency: string | null;
  verificationStatus?: string | null;
  reservationsEnabled?: boolean | null;
  hasPaymentMethods?: boolean;
  averageRating?: number | null;
  reviewCount?: number | null;
}

export interface DiscoveryPlaceSummary {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  placeType?: "CURATED" | "RESERVABLE";
  featuredRank?: number;
  provinceRank?: number;
  latitude?: number;
  longitude?: number;
  availabilityPreview?: DiscoveryAvailabilityPreview;
  meta?: DiscoveryPlaceSummaryMeta;
}

export interface PlaceCardMedia {
  coverImageUrl?: string;
  organizationLogoUrl?: string;
}

export interface PlaceCardMeta {
  sports: { id: string; name: string; slug: string }[];
  courtCount?: number;
  lowestPriceCents?: number;
  currency?: string;
  verificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  reservationsEnabled?: boolean;
  averageRating?: number | null;
  reviewCount?: number | null;
}

interface PlaceSummaryListItemMeta {
  sports: { id: string; slug: string; name: string }[];
  courtCount: number;
  lowestPriceCents: number | null;
  currency: string | null;
  verificationStatus?: string | null;
  reservationsEnabled?: boolean | null;
  hasPaymentMethods?: boolean;
  averageRating?: number | null;
  reviewCount?: number | null;
}

interface PlaceSummaryListItem {
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
  availabilityPreview?: DiscoveryAvailabilityPreview;
  meta?: PlaceSummaryListItemMeta;
}

interface DiscoveryResult {
  places: PlaceSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface DiscoverySummaryResult {
  places: DiscoveryPlaceSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type { PlaceSummary };

const mapPlaceSummaryItem = (
  item: PlaceSummaryListItem,
): DiscoveryPlaceSummary => {
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
    meta: item.meta,
  };
};

export function useModDiscoveryPlaces(options: UseDiscoveryOptions = {}) {
  const {
    q,
    province,
    city,
    sportId,
    amenities,
    verificationTier,
    page = 1,
    limit = DISCOVERY_SUMMARIES_DEFAULT_LIMIT,
  } = options;
  const offset = (page - 1) * limit;
  const { data: provincesCities } = usePHProvincesCitiesQuery();

  const resolvedLocation = useMemo(() => {
    if (!provincesCities) return null;

    const resolvedProvince = province
      ? findProvinceBySlug(provincesCities, province)
      : null;
    const resolvedCity = city
      ? (findCityBySlug(resolvedProvince, city) ??
        findCityBySlugAcrossProvinces(provincesCities, city)?.city ??
        null)
      : null;

    return {
      province: resolvedProvince?.name,
      city: resolvedCity?.name,
    };
  }, [city, province, provincesCities]);

  const query = useFeatureQuery(
    ["place", "list"],
    discoveryApi.queryPlaceList,
    {
      q,
      province: resolvedLocation?.province ?? undefined,
      city: resolvedLocation?.city ?? undefined,
      sportId,
      amenities,
      verificationTier,
      limit,
      offset,
    },
  );

  const transformedData: DiscoveryResult | undefined = query.data
    ? {
        places: query.data.items.map(mapPlaceSummary),
        total: query.data.total,
        page,
        limit,
        hasMore: offset + query.data.items.length < query.data.total,
      }
    : undefined;

  return {
    ...query,
    data: transformedData,
  } as typeof query & { data: DiscoveryResult | undefined };
}

export function useModDiscoveryPlaceSummaries(
  options: UseDiscoveryOptions = {},
) {
  const {
    q,
    province,
    city,
    sportId,
    date,
    time,
    amenities,
    verificationTier,
    page = 1,
    limit = DISCOVERY_SUMMARIES_DEFAULT_LIMIT,
    initialResolvedLocation,
  } = options;
  const { data: provincesCities } = usePHProvincesCitiesQuery();
  const queryClient = useQueryClient();

  const resolvedLocation = useMemo(() => {
    if (!provincesCities) {
      const matchesInitialLocation =
        province === initialResolvedLocation?.provinceSlug &&
        city === initialResolvedLocation?.citySlug;

      return {
        province:
          (matchesInitialLocation
            ? initialResolvedLocation?.provinceName
            : undefined) ??
          province ??
          undefined,
        city:
          (matchesInitialLocation
            ? initialResolvedLocation?.cityName
            : undefined) ??
          city ??
          undefined,
      };
    }

    const resolvedProvince = province
      ? findProvinceBySlug(provincesCities, province)
      : null;
    const resolvedCity = city
      ? (findCityBySlug(resolvedProvince, city) ??
        findCityBySlugAcrossProvinces(provincesCities, city)?.city ??
        null)
      : null;

    return {
      province: resolvedProvince?.name ?? province ?? undefined,
      city: resolvedCity?.name ?? city ?? undefined,
    };
  }, [city, initialResolvedLocation, province, provincesCities]);

  const currentQueryInput = useMemo(
    () =>
      buildDiscoveryPlaceListSummaryQueryInput({
        q,
        provinceName: resolvedLocation?.province,
        cityName: resolvedLocation?.city,
        sportId,
        date,
        time,
        amenities,
        verificationTier,
        limit,
        page,
      }),
    [
      amenities,
      limit,
      page,
      q,
      resolvedLocation?.city,
      resolvedLocation?.province,
      sportId,
      date,
      time,
      verificationTier,
    ],
  );

  const query = useQuery(
    createDiscoveryPlaceSummariesQueryOptions(
      discoveryApi.queryPlaceListSummary,
      currentQueryInput,
      {
        staleTime: currentQueryInput.date
          ? DISCOVERY_AVAILABILITY_STALE_TIME_MS
          : DISCOVERY_TIER1_STALE_TIME_MS,
        placeholderData: keepPreviousData,
      },
    ),
  );

  const transformedData: DiscoverySummaryResult | undefined = useMemo(
    () =>
      query.data
        ? {
            places: query.data.items.map(mapPlaceSummaryItem),
            total: query.data.total,
            page,
            limit,
            hasMore:
              currentQueryInput.offset + query.data.items.length <
              query.data.total,
          }
        : undefined,
    [currentQueryInput.offset, limit, page, query.data],
  );

  useEffect(() => {
    if (!transformedData?.hasMore || page !== 1) {
      return;
    }

    const nextQueryInput = buildDiscoveryPlaceListSummaryQueryInput({
      q,
      provinceName: resolvedLocation?.province,
      cityName: resolvedLocation?.city,
      sportId,
      date,
      time,
      amenities,
      verificationTier,
      limit,
      page: page + 1,
    });

    void queryClient.prefetchQuery(
      createDiscoveryPlaceSummariesQueryOptions(
        discoveryApi.queryPlaceListSummary,
        nextQueryInput,
        {
          staleTime: nextQueryInput.date
            ? DISCOVERY_AVAILABILITY_STALE_TIME_MS
            : DISCOVERY_TIER1_STALE_TIME_MS,
        },
      ),
    );
  }, [
    amenities,
    limit,
    page,
    q,
    queryClient,
    resolvedLocation?.city,
    resolvedLocation?.province,
    sportId,
    date,
    time,
    transformedData?.hasMore,
    verificationTier,
  ]);

  return {
    ...query,
    data: transformedData,
  } as typeof query & { data: DiscoverySummaryResult | undefined };
}

export function useQueryFeaturedPlaces(limit = 6) {
  const query = useFeatureQuery(
    ["place", "list"],
    discoveryApi.queryPlaceList,
    {
      featuredOnly: true,
      limit,
      offset: 0,
    },
  );

  const places: PlaceSummary[] = query.data
    ? query.data.items.map(mapPlaceSummary)
    : [];

  return {
    ...query,
    data: places,
  } as typeof query & { data: PlaceSummary[] };
}
