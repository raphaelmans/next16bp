import type { PlaceCardPlace } from "@/shared/components/kudos";
import { trpc } from "@/trpc/client";

interface UseDiscoveryOptions {
  q?: string;
  province?: string;
  city?: string;
  sportId?: string;
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
    name: string;
    address: string;
    city: string;
    latitude: string | null;
    longitude: string | null;
  };
  sports: { id: string; name: string; slug: string }[];
  courtCount?: number;
  lowestPriceCents?: number;
  currency?: string | null;
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
    name: item.place.name,
    address: item.place.address,
    city: item.place.city,
    coverImageUrl: undefined,
    sports: item.sports.map((sport) => ({
      id: sport.id,
      name: sport.name,
      slug: sport.slug,
    })),
    courtCount: item.courtCount,
    lowestPriceCents: item.lowestPriceCents,
    currency: item.currency ?? undefined,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };
};

export function useDiscoveryPlaces(options: UseDiscoveryOptions = {}) {
  const { q, province, city, sportId, page = 1, limit = 12 } = options;
  const offset = (page - 1) * limit;

  const query = trpc.place.list.useQuery({
    q,
    province,
    city,
    sportId,
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
    limit,
    offset: 0,
  });

  const places: PlaceSummary[] = query.data
    ? query.data.items.map(mapPlaceSummary).slice(0, limit)
    : [];

  return {
    ...query,
    data: places,
  } as typeof query & { data: PlaceSummary[] };
}
