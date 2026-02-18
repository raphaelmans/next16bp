"use client";

import { trpc } from "@/trpc/client";

export * from "./filters";
export * from "./place-detail";
export {
  useMutDiscoverySubmitClaim,
  useMutDiscoverySubmitGuestRemoval,
  useModDiscoveryPlaces,
  useModDiscoveryPlaceSummaries,
  useQueryDiscoveryAvailabilityForCourt,
  useQueryDiscoveryAvailabilityForCourtRange,
  useQueryDiscoveryAvailabilityForPlaceSportRange,
  useQueryDiscoveryOrganizations,
  useQueryDiscoverySports,
  useQueryFeaturedPlaces,
  type PlaceSummary,
} from "./search";

export function useModDiscoveryPrefetchPort() {
  return trpc.useUtils();
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
