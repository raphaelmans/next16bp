import { useMemo } from "react";
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

export interface PlaceSummary extends PlaceCardPlace {
  latitude?: number;
  longitude?: number;
}

interface PlaceListItem {
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
  coverImageUrl?: string | null;
  organizationLogoUrl?: string | null;
  sports: { id: string; name: string; slug: string }[];
  courtCount?: number;
  lowestPriceCents?: number;
  currency?: string | null;
  verificationStatus?:
    | "UNVERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "REJECTED"
    | null;
  reservationsEnabled?: boolean | null;
}

interface DiscoveryResult {
  places: PlaceSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const mapPlaceSummary = (item: PlaceListItem): PlaceSummary => {
  const latitude = Number.parseFloat(item.place.latitude ?? "");
  const longitude = Number.parseFloat(item.place.longitude ?? "");

  return {
    id: item.place.id,
    slug: item.place.slug ?? undefined,
    name: item.place.name,
    address: item.place.address,
    city: item.place.city,
    coverImageUrl: item.coverImageUrl ?? undefined,
    logoUrl: item.organizationLogoUrl ?? undefined,
    sports: item.sports.map((sport) => ({
      id: sport.id,
      name: sport.name,
      slug: sport.slug,
    })),
    courtCount: item.courtCount,
    lowestPriceCents: item.lowestPriceCents,
    currency: item.currency ?? undefined,
    placeType: item.place.placeType,
    verificationStatus: item.verificationStatus ?? undefined,
    reservationsEnabled: item.reservationsEnabled ?? undefined,
    featuredRank: item.place.featuredRank ?? 0,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };
};

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
