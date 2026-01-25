import { useMemo } from "react";
import {
  mapPlaceSummary,
  type PlaceSummary,
} from "@/features/discovery/helpers";
import type { PlaceCardPlace } from "@/shared/components/kudos";
import { usePHProvincesCitiesQuery } from "@/shared/lib/clients/ph-provinces-cities-client";
import {
  findCityBySlug,
  findCityBySlugAcrossProvinces,
  findProvinceBySlug,
} from "@/shared/lib/ph-location-data";
import { trpc } from "@/trpc/client";

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
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };
};

export const buildDiscoveryPlaceCard = (
  summary: DiscoveryPlaceSummary,
  media?: PlaceCardMedia,
  meta?: PlaceCardMeta,
): PlaceCardPlace => ({
  id: summary.id,
  slug: summary.slug ?? undefined,
  name: summary.name,
  address: summary.address,
  city: summary.city,
  coverImageUrl: media?.coverImageUrl,
  logoUrl: media?.organizationLogoUrl,
  sports: meta?.sports ?? [],
  courtCount: meta?.courtCount,
  lowestPriceCents: meta?.lowestPriceCents,
  currency: meta?.currency,
  placeType: summary.placeType,
  verificationStatus: meta?.verificationStatus,
  reservationsEnabled: meta?.reservationsEnabled,
  featuredRank: summary.featuredRank,
});

export function useDiscoveryPlaces(options: UseDiscoveryOptions = {}) {
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

  const query = trpc.place.list.useQuery({
    q,
    province: resolvedLocation?.province ?? undefined,
    city: resolvedLocation?.city ?? undefined,
    sportId,
    amenities,
    verificationTier,
    limit,
    offset,
  });

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

export function useDiscoveryPlaceSummaries(options: UseDiscoveryOptions = {}) {
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

  const query = trpc.place.listSummary.useQuery({
    q,
    province: resolvedLocation?.province ?? undefined,
    city: resolvedLocation?.city ?? undefined,
    sportId,
    amenities,
    verificationTier,
    limit,
    offset,
  });

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

export function useDiscoveryPlaceCardDetails(
  placeIds: string[],
  sportId?: string,
) {
  const queries = trpc.useQueries((t) => [
    t.place.cardMediaByIds({ placeIds }, { enabled: placeIds.length > 0 }),
    t.place.cardMetaByIds(
      { placeIds, sportId },
      { enabled: placeIds.length > 0 },
    ),
  ]);

  const mediaQuery = queries[0];
  const metaQuery = queries[1];

  const mediaById = useMemo(() => {
    const record: Record<string, PlaceCardMedia> = {};
    for (const item of mediaQuery?.data ?? []) {
      record[item.placeId] = {
        coverImageUrl: item.coverImageUrl ?? undefined,
        organizationLogoUrl: item.organizationLogoUrl ?? undefined,
      };
    }
    return record;
  }, [mediaQuery?.data]);

  const metaById = useMemo(() => {
    const record: Record<string, PlaceCardMeta> = {};
    for (const item of metaQuery?.data ?? []) {
      record[item.placeId] = {
        sports: item.sports ?? [],
        courtCount: item.courtCount,
        lowestPriceCents: item.lowestPriceCents ?? undefined,
        currency: item.currency ?? undefined,
        verificationStatus: item.verificationStatus ?? undefined,
        reservationsEnabled: item.reservationsEnabled ?? undefined,
      };
    }
    return record;
  }, [metaQuery?.data]);

  return {
    mediaById,
    metaById,
    isMediaLoading: mediaQuery?.isLoading ?? false,
    isMetaLoading: metaQuery?.isLoading ?? false,
  };
}

export function useFeaturedPlaces(limit = 6) {
  const query = trpc.place.list.useQuery({
    featuredOnly: true,
    limit,
    offset: 0,
  });

  const places: PlaceSummary[] = query.data
    ? query.data.items.map(mapPlaceSummary)
    : [];

  return {
    ...query,
    data: places,
  } as typeof query & { data: PlaceSummary[] };
}
