"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useHomeData() {
  const trpc = useTRPC();

  const profileQuery = useQuery(trpc.profile.me.queryOptions());

  const reservationsQuery = useQuery(
    trpc.reservation.getMy.queryOptions({ limit: 3 }),
  );

  const orgsQuery = useQuery(trpc.organization.my.queryOptions());

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
