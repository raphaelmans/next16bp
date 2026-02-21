"use client";

import { useFeatureQuery } from "@/common/feature-api-hooks";
import { getAdminApi } from "../api.runtime";

const adminApi = getAdminApi();

export interface AdminStats {
  pendingClaims: number;
  pendingVerifications: number;
  totalCourts: number;
  reservableCourts: number;
  activeOrganizations: number;
}

/**
 * Hook for sidebar badge stats only (claims + verifications).
 * Does NOT fetch court counts — use useQueryAdminStats() for pages that display those.
 */
export function useQueryAdminSidebarStats() {
  const claimsQuery = useFeatureQuery(
    ["admin", "claim", "getPending"],
    adminApi.queryAdminClaimGetPending,
    { limit: 1, offset: 0 },
    { staleTime: 30_000 },
  );

  const verificationsQuery = useFeatureQuery(
    ["admin", "placeVerification", "getPending"],
    adminApi.queryAdminPlaceVerificationGetPending,
    { limit: 1, offset: 0 },
    { staleTime: 30_000 },
  );

  return {
    data: {
      pendingClaims: claimsQuery.data?.total ?? 0,
      pendingVerifications: verificationsQuery.data?.total ?? 0,
      totalCourts: 0,
      reservableCourts: 0,
      activeOrganizations: 0,
    } satisfies AdminStats,
    isLoading: claimsQuery.isLoading || verificationsQuery.isLoading,
    isError: claimsQuery.isError || verificationsQuery.isError,
  };
}

/**
 * Hook for admin dashboard stats — includes court counts via dedicated stats endpoint.
 * Use only on pages that display totalCourts / reservableCourts (dashboard, courts list).
 */
export function useQueryAdminStats() {
  const claimsQuery = useFeatureQuery(
    ["admin", "claim", "getPending"],
    adminApi.queryAdminClaimGetPending,
    { limit: 1, offset: 0 },
    { staleTime: 30_000 },
  );

  const verificationsQuery = useFeatureQuery(
    ["admin", "placeVerification", "getPending"],
    adminApi.queryAdminPlaceVerificationGetPending,
    { limit: 1, offset: 0 },
    { staleTime: 30_000 },
  );

  const courtStatsQuery = useFeatureQuery(
    ["admin", "court", "stats"],
    adminApi.queryAdminCourtStats,
    undefined,
    {
      staleTime: 30_000,
    },
  );

  const stats: AdminStats = {
    pendingClaims: claimsQuery.data?.total ?? 0,
    pendingVerifications: verificationsQuery.data?.total ?? 0,
    totalCourts: courtStatsQuery.data?.total ?? 0,
    reservableCourts: courtStatsQuery.data?.reservable ?? 0,
    activeOrganizations: 0,
  };

  return {
    data: stats,
    isLoading:
      claimsQuery.isLoading ||
      verificationsQuery.isLoading ||
      courtStatsQuery.isLoading,
    isError:
      claimsQuery.isError ||
      verificationsQuery.isError ||
      courtStatsQuery.isError,
  };
}

export function useQueryAdminOrganizationSearch(
  input?: Parameters<typeof adminApi.queryAdminOrganizationSearch>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["admin", "organization", "search"],
    adminApi.queryAdminOrganizationSearch,
    input,
    options,
  );
}
