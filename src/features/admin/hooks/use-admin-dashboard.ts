"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export interface AdminStats {
  pendingClaims: number;
  totalCourts: number;
  reservableCourts: number;
  activeOrganizations: number;
}

export interface PendingClaim {
  id: string;
  courtId: string;
  organizationId: string;
  submittedAt: string;
  type: "claim" | "removal";
  // Note: courtName and organizationName would need to be fetched separately
  // or the backend endpoint enhanced to include this data
  courtName?: string;
  organizationName?: string;
}

export interface AdminActivity {
  id: string;
  type:
    | "claim_approved"
    | "claim_rejected"
    | "court_added"
    | "court_deactivated";
  description: string;
  timestamp: string;
  actor: string;
}

// Mock activity data (no backend endpoint for this yet)
const mockRecentActivity: AdminActivity[] = [
  {
    id: "activity-1",
    type: "claim_approved",
    description: "Approved claim for Quezon City Sports Complex",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    actor: "Admin User",
  },
  {
    id: "activity-2",
    type: "court_added",
    description: "Added new curated court: Alabang Country Club",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    actor: "Admin User",
  },
  {
    id: "activity-3",
    type: "claim_rejected",
    description:
      "Rejected claim for Manila Bay Courts - insufficient documentation",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    actor: "Admin User",
  },
];

/**
 * Hook for admin dashboard stats
 * Aggregates data from multiple endpoints
 */
export function useAdminStats() {
  const trpc = useTRPC();

  // Fetch pending claims count
  const claimsQuery = useQuery(
    trpc.admin.claim.getPending.queryOptions({
      limit: 1,
      offset: 0,
    }),
  );

  // Fetch courts count
  const courtsQuery = useQuery(
    trpc.admin.court.list.queryOptions({
      limit: 1,
      offset: 0,
    }),
  );

  // Fetch reservable courts count
  const reservableQuery = useQuery(
    trpc.admin.court.list.queryOptions({
      courtType: "RESERVABLE",
      limit: 1,
      offset: 0,
    }),
  );

  // Calculate stats from responses
  const stats: AdminStats = {
    pendingClaims: claimsQuery.data?.total ?? 0,
    totalCourts: courtsQuery.data?.total ?? 0,
    reservableCourts: reservableQuery.data?.total ?? 0,
    activeOrganizations: 0, // Would need a separate endpoint
  };

  return {
    data: stats,
    isLoading:
      claimsQuery.isLoading ||
      courtsQuery.isLoading ||
      reservableQuery.isLoading,
    isError:
      claimsQuery.isError || courtsQuery.isError || reservableQuery.isError,
  };
}

/**
 * Hook to fetch pending claims for admin dashboard
 * Connected to admin.claim.getPending tRPC endpoint
 *
 * Note: The backend returns basic claim records. For a richer UI showing
 * court/org names, either:
 * 1. Fetch each claim's detail separately (N+1 queries)
 * 2. Enhance the backend to return enriched data
 */
export function usePendingClaims(limit = 5) {
  const trpc = useTRPC();

  const query = useQuery(
    trpc.admin.claim.getPending.queryOptions({
      limit,
      offset: 0,
    }),
  );

  // Transform data to match the expected format
  const transformedData: PendingClaim[] = (query.data?.items ?? []).map(
    (item) => ({
      id: item.id,
      courtId: item.courtId,
      organizationId: item.organizationId,
      submittedAt: item.createdAt,
      type: item.requestType === "REMOVAL" ? "removal" : "claim",
      // These would need to be fetched separately or backend enhanced
      courtName: `Court ${item.courtId.slice(0, 8)}...`,
      organizationName: `Org ${item.organizationId.slice(0, 8)}...`,
    }),
  );

  return {
    ...query,
    data: transformedData,
  };
}

/**
 * Hook for admin recent activity
 * Uses mock data as there's no backend endpoint for this yet
 */
export function useAdminRecentActivity(limit?: number) {
  return useQuery({
    queryKey: ["admin", "recent-activity", limit],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return limit ? mockRecentActivity.slice(0, limit) : mockRecentActivity;
    },
  });
}
