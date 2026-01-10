"use client";

import { useQuery } from "@tanstack/react-query";
import type { CourtCardCourt } from "@/shared/components/kudos";
import { useTRPC } from "@/trpc/client";

interface UseDiscoveryOptions {
  q?: string;
  city?: string;
  type?: "CURATED" | "RESERVABLE";
  isFree?: boolean;
  amenities?: string[];
  page?: number;
  limit?: number;
}

interface DiscoveryResult {
  courts: CourtCardCourt[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Transform backend court list item to CourtCardCourt
 */
function transformCourtListItem(item: {
  court: {
    id: string;
    name: string;
    address: string;
    city: string;
    courtType: "CURATED" | "RESERVABLE";
    latitude: string;
    longitude: string;
  };
  photoUrl?: string;
  amenityCount: number;
  isFree?: boolean;
}): CourtCardCourt {
  return {
    id: item.court.id,
    name: item.court.name,
    address: item.court.address,
    city: item.court.city,
    type: item.court.courtType,
    coverImageUrl: item.photoUrl,
    isFree: item.isFree ?? item.court.courtType === "CURATED",
  };
}

/**
 * Hook to fetch courts for discovery page
 * Connected to court.search tRPC endpoint
 */
export function useDiscovery(options: UseDiscoveryOptions = {}) {
  const { city, type, isFree, page = 1, limit = 12 } = options;

  const trpc = useTRPC();

  const offset = (page - 1) * limit;

  return useQuery(
    trpc.court.search.queryOptions({
      city: city || undefined,
      courtType: type,
      isFree,
      limit,
      offset,
    }),
  );
}

/**
 * Hook to fetch courts with transformed data for UI
 */
export function useDiscoveryCourts(options: UseDiscoveryOptions = {}) {
  const { city, type, isFree, page = 1, limit = 12 } = options;

  const trpc = useTRPC();
  const offset = (page - 1) * limit;

  const query = useQuery(
    trpc.court.search.queryOptions({
      city: city || undefined,
      courtType: type,
      isFree,
      limit,
      offset,
    }),
  );

  // Transform the data for UI consumption
  const transformedData: DiscoveryResult | undefined = query.data
    ? {
        courts: query.data.items.map(transformCourtListItem),
        total: query.data.total,
        page,
        limit,
        hasMore: offset + query.data.items.length < query.data.total,
      }
    : undefined;

  return {
    ...query,
    data: transformedData,
  };
}

/**
 * Hook to fetch featured courts for home page
 * Uses search with a limit to get recent active courts
 */
export function useFeaturedCourts(limit = 6) {
  const trpc = useTRPC();

  const query = useQuery(
    trpc.court.search.queryOptions({
      limit,
      offset: 0,
    }),
  );

  return {
    ...query,
    data: query.data?.items.map(transformCourtListItem) ?? [],
  };
}
