"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useOwnerCourts } from "./use-owner-courts";

/**
 * Fetch real owner stats from backend.
 * Simplified to only show available data.
 */
export function useOwnerStats(organizationId: string | null) {
  const trpc = useTRPC();

  const { data: courts = [], isLoading: courtsLoading } =
    useOwnerCourts(organizationId);

  const { data: pendingCount, isLoading: pendingLoading } = useQuery({
    ...trpc.reservationOwner.getPendingCount.queryOptions({
      organizationId: organizationId ?? "",
    }),
    enabled: !!organizationId,
  });

  return {
    data: {
      activeCourts: courts.filter((court) => court.isActive).length,
      pendingReservations: pendingCount ?? 0,
    },
    isLoading: courtsLoading || pendingLoading,
  };
}

/**
 * Recent activity - returns empty for now (Coming Soon)
 */
export function useRecentActivity() {
  return {
    data: [],
    isLoading: false,
  };
}

/**
 * Today's bookings - returns empty for now (Coming Soon)
 */
export function useTodaysBookings() {
  return {
    data: [],
    isLoading: false,
  };
}

// Keep for backward compatibility but mark as deprecated
/** @deprecated Use useOwnerStats instead */
export function useOwnerDashboard() {
  return useQuery({
    queryKey: ["owner", "dashboard", "deprecated"],
    queryFn: async () => ({
      stats: {
        activeCourts: 0,
        pendingBookings: 0,
        todaysBookings: 0,
        monthlyRevenue: 0,
      },
      recentActivity: [],
      todaysBookings: [],
    }),
  });
}
