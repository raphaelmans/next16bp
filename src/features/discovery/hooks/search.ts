"use client";

import { useMemo } from "react";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import {
  findCityBySlug,
  findCityBySlugAcrossProvinces,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import {
  mapPlaceSummary,
  type PlaceSummary,
} from "@/features/discovery/helpers";
import { getDiscoveryApi } from "../api.runtime";

const discoveryApi = getDiscoveryApi();

type DiscoveryAvailabilityForCourtInput = {
  courtId: string;
  date: string;
  durationMinutes: number;
  includeUnavailable: boolean;
  selectedAddonIds?: string[];
};

type DiscoveryAvailabilityForCourtRangeInput = {
  courtId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable: boolean;
  selectedAddonIds?: string[];
};

type DiscoveryAvailabilityForPlaceSportRangeInput = {
  placeId: string;
  sportId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable: boolean;
  includeCourtOptions: boolean;
  selectedAddonIds?: string[];
};

export function useQueryDiscoverySports() {
  return useFeatureQuery(["sport", "list"], discoveryApi.querySportList, {});
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
  return useFeatureQuery(
    ["availability", "getForCourt"],
    discoveryApi.queryAvailabilityGetForCourt,
    input,
    { enabled },
  );
}

export function useQueryDiscoveryAvailabilityForCourtRange(
  input: DiscoveryAvailabilityForCourtRangeInput,
  enabled: boolean,
) {
  return useFeatureQuery(
    ["availability", "getForCourtRange"],
    discoveryApi.queryAvailabilityGetForCourtRange,
    input,
    { enabled },
  );
}

export function useQueryDiscoveryAvailabilityForPlaceSportRange(
  input: DiscoveryAvailabilityForPlaceSportRangeInput,
  enabled: boolean,
) {
  return useFeatureQuery(
    ["availability", "getForPlaceSportRange"],
    discoveryApi.queryAvailabilityGetForPlaceSportRange,
    input,
    { enabled },
  );
}

interface UseDiscoveryOptions {
  q?: string;
  province?: string;
  city?: string;
  sportId?: string;
  amenities?: string[];
  verificationTier?:
    | "verified_reservable"
    | "curated"
    | "unverified_reservable";
  page?: number;
  limit?: number;
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
    limit = 12,
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
    amenities,
    verificationTier,
    page = 1,
    limit = 12,
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
    ["place", "listSummary"],
    discoveryApi.queryPlaceListSummary,
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

  const transformedData: DiscoverySummaryResult | undefined = query.data
    ? {
        places: query.data.items.map(mapPlaceSummaryItem),
        total: query.data.total,
        page,
        limit,
        hasMore: offset + query.data.items.length < query.data.total,
      }
    : undefined;

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
