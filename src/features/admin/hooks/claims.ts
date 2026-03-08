"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { toast } from "@/common/toast";
import { buildTrpcQueryKey } from "@/common/trpc-query-key";
import { getAdminApi } from "../api.runtime";

const adminApi = getAdminApi();

export interface PendingClaim {
  id: string;
  placeId: string;
  organizationId: string | null;
  submittedAt: string;
  type: "claim" | "removal";
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

export function useQueryPendingClaims(limit = 5) {
  const query = useFeatureQuery(
    ["admin", "claim", "getPending"],
    adminApi.queryAdminClaimGetPending,
    {
      limit,
      offset: 0,
    },
  );

  // Transform data to match the expected format
  const transformedData: PendingClaim[] = (query.data?.items ?? []).map(
    (item) => ({
      id: item.id,
      placeId: item.placeId,
      organizationId: item.organizationId,
      submittedAt: item.createdAt,
      type: item.requestType === "REMOVAL" ? "removal" : "claim",
      // These would need to be fetched separately or backend enhanced
      courtName: `Venue ${item.placeId.slice(0, 8)}...`,
      organizationName: item.organizationId
        ? `Org ${item.organizationId.slice(0, 8)}...`
        : "Unassigned organization",
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
export function useQueryAdminRecentActivity(limit?: number) {
  return useQuery({
    queryKey: ["admin", "recent-activity", limit],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return limit ? mockRecentActivity.slice(0, limit) : mockRecentActivity;
    },
  });
}

// ============================================================================
// From use-claims.ts
// ============================================================================

export type ClaimType = "claim" | "removal";
export type ClaimStatus = "pending" | "approved" | "rejected";

export interface Claim {
  id: string;
  type: ClaimType;
  status: ClaimStatus;
  courtId: string;
  courtName: string;
  courtAddress: string;
  courtImageUrl?: string;
  courtStatus: "curated" | "reservable";
  organizationId: string | null;
  organizationName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  guestName?: string;
  guestEmail?: string;
  courtsOwnedCount: number;
  notes?: string;
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ClaimEvent {
  id: string;
  type: "submitted" | "approved" | "rejected" | "note_added";
  description: string;
  actor: string;
  timestamp: string;
}

interface UseClaimsOptions {
  type?: ClaimType | "all";
  status?: ClaimStatus | "all";
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook to fetch claims list
 * Connected to admin.claim.getPending tRPC endpoint
 */
export function useModClaims(options: UseClaimsOptions = {}) {
  const { status: _status, page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  // Only fetch pending claims for now (backend only supports pending filter)
  const query = useFeatureQuery(
    ["admin", "claim", "getPending"],
    adminApi.queryAdminClaimGetPending,
    {
      limit,
      offset,
    },
  );

  // Transform to expected format
  const transformedData = query.data
    ? {
        claims: query.data.items.map((item) => ({
          id: item.id,
          type: (item.requestType === "REMOVAL"
            ? "removal"
            : "claim") as ClaimType,
          status: item.status.toLowerCase() as ClaimStatus,
          courtId: item.placeId,
          courtName: `Venue ${item.placeId.slice(0, 8)}...`,
          courtAddress: "Address pending...",
          courtStatus: "curated" as const,
          organizationId: item.organizationId ?? null,
          organizationName: item.organizationId
            ? `Org ${item.organizationId.slice(0, 8)}...`
            : "Guest request",
          ownerName: "",
          ownerEmail: "loading@example.com",
          guestName: item.guestName ?? undefined,
          guestEmail: item.guestEmail ?? undefined,
          reviewedBy: item.reviewerUserId ?? undefined,
          notes: item.requestNotes ?? undefined,
          reviewNotes: item.reviewNotes ?? undefined,
          submittedAt: item.createdAt,
          reviewedAt: item.reviewedAt ?? undefined,
        })),
        total: query.data.total,
        page,
        totalPages: Math.ceil(query.data.total / limit),
      }
    : undefined;

  return {
    ...query,
    data: transformedData,
  };
}

/**
 * Hook to fetch a single claim with full details
 * Connected to admin.claim.getById tRPC endpoint
 */
export function useQueryClaim(claimId: string) {
  const query = useFeatureQuery(
    ["admin", "claim", "getById"],
    adminApi.queryAdminClaimGetById,
    { id: claimId },
    { enabled: !!claimId },
  );

  // Transform to expected format
  const transformedData: Claim | undefined = query.data
    ? {
        id: query.data.claimRequest.id,
        type: (query.data.claimRequest.requestType === "REMOVAL"
          ? "removal"
          : "claim") as ClaimType,
        status: query.data.claimRequest.status.toLowerCase() as ClaimStatus,
        courtId: query.data.place.id,
        courtName: query.data.place.name,
        courtAddress: query.data.place.address,
        courtStatus:
          query.data.place.placeType === "CURATED" ? "curated" : "reservable",
        organizationId: query.data.organization?.id ?? null,
        organizationName: query.data.organization?.name ?? "Guest request",
        ownerName: query.data.organization?.name ?? "Guest",
        ownerEmail: "", // Not in the response
        guestName: query.data.claimRequest.guestName ?? undefined,
        guestEmail: query.data.claimRequest.guestEmail ?? undefined,
        reviewedBy: query.data.claimRequest.reviewerUserId ?? undefined,
        notes: query.data.claimRequest.requestNotes ?? undefined,
        reviewNotes: query.data.claimRequest.reviewNotes ?? undefined,
        submittedAt: query.data.claimRequest.createdAt,
        reviewedAt: query.data.claimRequest.reviewedAt ?? undefined,
        courtsOwnedCount: 0, // Would need separate query
      }
    : undefined;

  return {
    ...query,
    data: transformedData,
  };
}

/**
 * Hook to fetch claim events
 * Uses events from the claim detail response
 */
export function useQueryClaimEvents(claimId: string) {
  const query = useFeatureQuery(
    ["admin", "claim", "getById"],
    adminApi.queryAdminClaimGetById,
    { id: claimId },
    { enabled: !!claimId },
  );

  // Transform events to expected format
  const transformedData: ClaimEvent[] = (query.data?.events ?? []).map(
    (event) => ({
      id: event.id,
      type:
        event.toStatus === "PENDING"
          ? "submitted"
          : event.toStatus === "APPROVED"
            ? "approved"
            : "rejected",
      description: event.notes ?? `Status changed to ${event.toStatus}`,
      actor: event.triggeredByUserId ? "Admin" : "System",
      timestamp: event.createdAt,
    }),
  );

  return {
    ...query,
    data: transformedData,
  };
}

/**
 * Hook to approve a claim
 * Connected to admin.claim.approve tRPC endpoint
 */
export function useMutApproveClaim() {
  const queryClient = useQueryClient();

  return useFeatureMutation(adminApi.mutAdminClaimApprove, {
    onSuccess: async () => {
      toast.success("Claim approved successfully");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: buildTrpcQueryKey(["admin", "claim", "getPending"]),
        }),
        queryClient.invalidateQueries({
          queryKey: buildTrpcQueryKey(["admin", "claim", "getById"]),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve claim");
    },
  });
}

/**
 * Hook to reject a claim
 * Connected to admin.claim.reject tRPC endpoint
 */
export function useMutRejectClaim() {
  const queryClient = useQueryClient();

  return useFeatureMutation(adminApi.mutAdminClaimReject, {
    onSuccess: async () => {
      toast.success("Claim rejected");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: buildTrpcQueryKey(["admin", "claim", "getPending"]),
        }),
        queryClient.invalidateQueries({
          queryKey: buildTrpcQueryKey(["admin", "claim", "getById"]),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject claim");
    },
  });
}

/**
 * Hook to get claim counts by status
 */
export function useQueryClaimCounts() {
  const pendingQuery = useFeatureQuery(
    ["admin", "claim", "getPending"],
    adminApi.queryAdminClaimGetPending,
    {
      limit: 1,
      offset: 0,
    },
  );

  return {
    data: {
      pending: pendingQuery.data?.total ?? 0,
      approved: 0, // Would need a separate endpoint
      rejected: 0, // Would need a separate endpoint
      total: pendingQuery.data?.total ?? 0,
    },
    isLoading: pendingQuery.isLoading,
  };
}
