"use client";

import { trpc } from "@/trpc/client";

// ============================================================================
// From use-home-data.ts
// ============================================================================

export function useHomeData() {
  const profileQuery = trpc.profile.me.useQuery();

  const reservationsQuery = trpc.reservation.getMyWithDetails.useQuery({
    limit: 10,
    offset: 0,
  });

  const orgsQuery = trpc.organization.my.useQuery();

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
