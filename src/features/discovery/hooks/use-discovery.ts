"use client";

import { useQuery } from "@tanstack/react-query";
import type { PlaceCardPlace } from "@/shared/components/kudos";
import { useTRPCClient } from "@/trpc/client";

interface UseDiscoveryOptions {
  q?: string;
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
    latitude: string;
    longitude: string;
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
  const latitude = Number.parseFloat(item.place.latitude);
  const longitude = Number.parseFloat(item.place.longitude);

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

const matchesQuery = (place: PlaceSummary, query?: string) => {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [place.name, place.address, place.city].some((value) =>
    value.toLowerCase().includes(normalized),
  );
};

export function useDiscoveryPlaces(options: UseDiscoveryOptions = {}) {
  const { q, city, sportId, page = 1, limit = 12 } = options;
  const trpcClient = useTRPCClient();
  const offset = (page - 1) * limit;

  const query = useQuery({
    queryKey: ["place-discovery", q, city, sportId, page, limit],
    queryFn: async () =>
      trpcClient.place.list.query({
        city,
        sportId,
        limit,
        offset,
      }),
  });

  const transformedData: DiscoveryResult | undefined = query.data
    ? (() => {
        const response = query.data as {
          items: PlaceListItem[];
          total: number;
        };
        const mappedPlaces = response.items.map(mapPlaceSummary);
        const filteredPlaces = mappedPlaces.filter((place) =>
          matchesQuery(place, q),
        );
        const total = q ? filteredPlaces.length : response.total;
        const hasMore =
          !q && (page - 1) * limit + response.items.length < response.total;

        return {
          places: filteredPlaces,
          total,
          page,
          limit,
          hasMore,
        };
      })()
    : undefined;

  return {
    ...query,
    data: transformedData,
  } as typeof query & { data: DiscoveryResult | undefined };
}

export function useFeaturedPlaces(limit = 6) {
  const trpcClient = useTRPCClient();

  const query = useQuery({
    queryKey: ["place-featured", limit],
    queryFn: async () =>
      trpcClient.place.list.query({
        limit,
        offset: 0,
      }),
  });

  const places: PlaceSummary[] = query.data
    ? (query.data as { items: PlaceListItem[] }).items
        .map(mapPlaceSummary)
        .slice(0, limit)
    : [];

  return {
    ...query,
    data: places,
  } as typeof query & { data: PlaceSummary[] };
}
