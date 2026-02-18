"use client";

import { useFeatureQuery } from "@/common/feature-api-hooks";
import { getHomeApi } from "./api.runtime";

const homeApi = getHomeApi();

// ============================================================================
// From use-home-data.ts
// ============================================================================

export function useQueryHomeData() {
  const profileQuery = useFeatureQuery(
    ["profile", "me"],
    homeApi.queryProfileMe,
  );

  const reservationsQuery = useFeatureQuery(
    ["reservation", "getMyWithDetails"],
    homeApi.queryReservationGetMyWithDetails,
    {
      limit: 10,
      offset: 0,
    },
  );

  const orgsQuery = useFeatureQuery(
    ["organization", "my"],
    homeApi.queryOrganizationMy,
  );

  const organization = orgsQuery.data?.[0] ?? null;

  const isProfileComplete = !!(
    profileQuery.data?.displayName &&
    (profileQuery.data?.email || profileQuery.data?.phoneNumber)
  );

  return {
    profile: profileQuery.data,
    reservations: reservationsQuery.data ?? [],
    organization,
    isProfileComplete,
    isLoading:
      profileQuery.isLoading ||
      reservationsQuery.isLoading ||
      orgsQuery.isLoading,
  };
}

export function useQueryHomePlaceStats() {
  return useFeatureQuery(["place", "stats"], homeApi.queryPlaceStats);
}
