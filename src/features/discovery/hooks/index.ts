"use client";

import { useMemo } from "react";
import { useFeatureQueryCache } from "@/common/feature-api-hooks";
import {
  normalizeAvailabilityCourtRangeInput,
  normalizeAvailabilityPlaceSportRangeInput,
} from "@/common/query-keys";
import { trpc } from "@/trpc/client";
import { getDiscoveryApi } from "../api.runtime";

export * from "./bookmark";
export * from "./filters";
export * from "./place-detail";
export {
  type PlaceSummary,
  useModDiscoveryPlaceSummaries,
  useModDiscoveryPlaces,
  useMutDiscoverySubmitClaim,
  useMutDiscoverySubmitGuestRemoval,
  useQueryDiscoveryAvailabilityForCourt,
  useQueryDiscoveryAvailabilityForCourtRange,
  useQueryDiscoveryAvailabilityForPlaceSportRange,
  useQueryDiscoveryOrganizations,
  useQueryDiscoverySports,
  useQueryFeaturedPlaces,
} from "./search";

const discoveryApi = getDiscoveryApi();

type DiscoveryPrefetchCache = ReturnType<typeof useFeatureQueryCache>;

type CourtRangePrefetchInput = {
  courtId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable?: boolean;
  selectedAddons?: { addonId: string; quantity: number }[];
};

type PlaceSportRangePrefetchInput = {
  placeId: string;
  sportId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  includeUnavailable?: boolean;
  includeCourtOptions?: boolean;
  selectedAddons?: { addonId: string; quantity: number }[];
};

export function createDiscoveryPrefetchPort(
  cache: DiscoveryPrefetchCache,
  api = discoveryApi,
) {
  return {
    availability: {
      getForCourtRange: {
        getData: (input: CourtRangePrefetchInput) => {
          const normalizedInput = normalizeAvailabilityCourtRangeInput(input);
          return cache.getData(
            ["availability", "getForCourtRange"],
            normalizedInput,
          );
        },
        fetch: (input: CourtRangePrefetchInput) => {
          const normalizedInput = normalizeAvailabilityCourtRangeInput(input);
          return cache.fetch(
            ["availability", "getForCourtRange"],
            normalizedInput,
            () => api.queryAvailabilityGetForCourtRange(normalizedInput),
          );
        },
      },
      getForPlaceSportRange: {
        getData: (input: PlaceSportRangePrefetchInput) => {
          const normalizedInput =
            normalizeAvailabilityPlaceSportRangeInput(input);
          return cache.getData(
            ["availability", "getForPlaceSportRange"],
            normalizedInput,
          );
        },
        fetch: (input: PlaceSportRangePrefetchInput) => {
          const normalizedInput =
            normalizeAvailabilityPlaceSportRangeInput(input);
          return cache.fetch(
            ["availability", "getForPlaceSportRange"],
            normalizedInput,
            () => api.queryAvailabilityGetForPlaceSportRange(normalizedInput),
          );
        },
      },
    },
  };
}

export function useModDiscoveryPrefetchPort() {
  const cache = useFeatureQueryCache();

  return useMemo(() => createDiscoveryPrefetchPort(cache), [cache]);
}

export function useModDiscoveryInvalidation() {
  const cache = trpc.useUtils();

  const invalidatePlaceByIdOrSlug = (
    ...args: Parameters<typeof cache.place.getByIdOrSlug.invalidate>
  ) => cache.place.getByIdOrSlug.invalidate(...args);

  return {
    invalidatePlaceByIdOrSlug,
  };
}
