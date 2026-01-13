"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

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
  organizationId: string;
  organizationName: string;
  organizationLogoUrl?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
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
export function useClaims(options: UseClaimsOptions = {}) {
  const { status: _status, page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  // Only fetch pending claims for now (backend only supports pending filter)
  const query = trpc.admin.claim.getPending.useQuery({
    limit,
    offset,
  });

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
          courtName: `Place ${item.placeId.slice(0, 8)}...`,
          courtAddress: "Address pending...",
          courtStatus: "curated" as const,
          organizationId: item.organizationId,
          organizationName: `Org ${item.organizationId.slice(0, 8)}...`,
          ownerName: "Loading...",
          ownerEmail: "loading@example.com",
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
export function useClaim(claimId: string) {
  const query = trpc.admin.claim.getById.useQuery(
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
        organizationId: query.data.organization.id,
        organizationName: query.data.organization.name,
        ownerName: query.data.organization.name,
        ownerEmail: "owner@example.com", // Not in the response
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
export function useClaimEvents(claimId: string) {
  const query = trpc.admin.claim.getById.useQuery(
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
export function useApproveClaim() {
  const utils = trpc.useUtils();

  return trpc.admin.claim.approve.useMutation({
    onSuccess: async () => {
      toast.success("Claim approved successfully");
      await utils.admin.claim.invalidate();
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
export function useRejectClaim() {
  const utils = trpc.useUtils();

  return trpc.admin.claim.reject.useMutation({
    onSuccess: async () => {
      toast.success("Claim rejected");
      await utils.admin.claim.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject claim");
    },
  });
}

/**
 * Hook to get claim counts by status
 */
export function useClaimCounts() {
  const pendingQuery = trpc.admin.claim.getPending.useQuery({
    limit: 1,
    offset: 0,
  });

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
