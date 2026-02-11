"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import { trpc } from "@/trpc/client";

// ============================================================================
// From use-admin-courts.ts
// ============================================================================

export type CourtType = "curated" | "reservable";
export type CourtStatus = "active" | "inactive";
export type ClaimStatusFilter =
  | "unclaimed"
  | "claim_pending"
  | "claimed"
  | "removal_requested";
export type FeaturedFilter = "all" | "featured" | "not_featured";

export interface AdminCourt {
  id: string;
  slug?: string | null;
  name: string;
  address: string;
  city: string;
  type: CourtType;
  status: CourtStatus;
  imageUrl?: string;
  organizationId?: string;
  organizationName?: string;
  claimStatus?: ClaimStatusFilter;
  featuredRank?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCourtDetail {
  organization: { id: string; name: string; slug: string } | null;
  place: {
    id: string;
    slug?: string | null;
    name: string;
    address: string;
    city: string;
    province: string;
    country: string;
    latitude: string | null;
    longitude: string | null;
    extGPlaceId: string | null;
    timeZone: string;
    placeType: "CURATED" | "RESERVABLE";
    claimStatus:
      | "UNCLAIMED"
      | "CLAIM_PENDING"
      | "CLAIMED"
      | "REMOVAL_REQUESTED";
    isActive: boolean;
    featuredRank: number;
  };
  contactDetail: {
    facebookUrl: string | null;
    instagramUrl: string | null;
    phoneNumber: string | null;
    viberInfo: string | null;
    websiteUrl: string | null;
    otherContactInfo: string | null;
  } | null;
  photos: Array<{ id: string; url: string; displayOrder: number }>;
  amenities: Array<{ id: string; name: string }>;
  courts: Array<{
    court: {
      id: string;
      label: string;
      sportId: string;
      tierLabel: string | null;
    };
    sport: { id: string; name: string };
  }>;
}

interface UseAdminCourtsOptions {
  type?: CourtType | "all";
  status?: CourtStatus | "all";
  province?: string | "all";
  city?: string | "all";
  claimStatus?: ClaimStatusFilter | "all";
  featured?: FeaturedFilter;
  search?: string;
  page?: number;
  limit?: number;
}

const claimStatusMap: Record<
  ClaimStatusFilter,
  "UNCLAIMED" | "CLAIM_PENDING" | "CLAIMED" | "REMOVAL_REQUESTED"
> = {
  unclaimed: "UNCLAIMED",
  claim_pending: "CLAIM_PENDING",
  claimed: "CLAIMED",
  removal_requested: "REMOVAL_REQUESTED",
};

const toClaimStatusFilter = (value: string | null | undefined) => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "claim_pending") return "claim_pending" as const;
  if (normalized === "removal_requested") return "removal_requested" as const;
  if (normalized === "unclaimed") return "unclaimed" as const;
  if (normalized === "claimed") return "claimed" as const;
  return undefined;
};

const toIsoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : value;

const toAdminCourt = (
  place: {
    id: string;
    slug?: string | null;
    name: string;
    address: string;
    city: string;
    placeType: "CURATED" | "RESERVABLE";
    claimStatus:
      | "UNCLAIMED"
      | "CLAIM_PENDING"
      | "CLAIMED"
      | "REMOVAL_REQUESTED";
    isActive: boolean;
    featuredRank: number;
    organizationId: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
  },
  organizationName?: string | null,
): AdminCourt => ({
  id: place.id,
  slug: place.slug ?? null,
  name: place.name,
  address: place.address,
  city: place.city,
  type: place.placeType === "CURATED" ? "curated" : "reservable",
  status: place.isActive ? "active" : "inactive",
  organizationId: place.organizationId ?? undefined,
  organizationName: organizationName ?? undefined,
  claimStatus: toClaimStatusFilter(place.claimStatus),
  featuredRank: place.featuredRank ?? 0,
  createdAt: toIsoString(place.createdAt),
  updatedAt: toIsoString(place.updatedAt),
});

type AdminCourtPlace = Parameters<typeof toAdminCourt>[0];
type AdminCourtListItem = {
  place: AdminCourtPlace;
  organizationName: string | null;
};

export function useAdminCourts(options: UseAdminCourtsOptions = {}) {
  const {
    type,
    status,
    province,
    city,
    claimStatus,
    featured,
    search,
    page = 1,
    limit = 10,
  } = options;

  const offset = (page - 1) * limit;
  const placeTypeInput =
    type && type !== "all"
      ? type === "curated"
        ? "CURATED"
        : "RESERVABLE"
      : undefined;
  const claimStatusInput =
    claimStatus && claimStatus !== "all"
      ? claimStatusMap[claimStatus]
      : undefined;
  const featuredInput =
    featured && featured !== "all" ? featured === "featured" : undefined;

  const query = trpc.admin.court.list.useQuery(
    {
      limit,
      offset,
      placeType: placeTypeInput,
      isActive: status && status !== "all" ? status === "active" : undefined,
      province: province && province !== "all" ? province : undefined,
      city: city && city !== "all" ? city : undefined,
      claimStatus: claimStatusInput,
      featured: featuredInput,
      search: search || undefined,
    },
    { staleTime: 5_000 },
  );

  const total = query.data?.total ?? 0;
  const courts =
    query.data?.items.map((item: AdminCourtListItem) =>
      toAdminCourt(item.place, item.organizationName),
    ) ?? [];

  return {
    ...query,
    data: query.data
      ? {
          courts,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        }
      : undefined,
  };
}

export function useAdminCourt(courtId: string) {
  const query = trpc.admin.court.getById.useQuery(
    { placeId: courtId },
    { enabled: !!courtId },
  );

  return {
    ...query,
    data: query.data as AdminCourtDetail | undefined,
  };
}

export function useTransferPlaceToOrganization() {
  const utils = trpc.useUtils();

  return trpc.admin.court.transfer.useMutation({
    onSuccess: async (_data, variables) => {
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.getById.invalidate({ placeId: variables.placeId }),
      ]);
    },
  });
}

export function useRecuratePlace() {
  const utils = trpc.useUtils();

  return trpc.admin.court.recurate.useMutation({
    onSuccess: async (_data, variables) => {
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.getById.invalidate({ placeId: variables.placeId }),
      ]);
    },
  });
}

export function useToggleCourtStatus() {
  const utils = trpc.useUtils();
  const activateMutation = trpc.admin.court.activate.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.getById.invalidate(),
      ]);
    },
  });
  const deactivateMutation = trpc.admin.court.deactivate.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.getById.invalidate(),
      ]);
    },
  });

  type ToggleOptions = Parameters<typeof activateMutation.mutate>[1];

  const mutate = (
    {
      courtId,
      status,
    }: {
      courtId: string;
      status: CourtStatus;
    },
    options?: ToggleOptions,
  ) => {
    if (status === "inactive") {
      return deactivateMutation.mutate(
        {
          placeId: courtId,
          reason: "Admin deactivated via dashboard",
        },
        options,
      );
    }

    return activateMutation.mutate({ placeId: courtId }, options);
  };

  return {
    mutate,
    isPending: activateMutation.isPending || deactivateMutation.isPending,
  };
}

export function useDeleteAdminPlace() {
  const utils = trpc.useUtils();

  return trpc.admin.court.deletePlace.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.stats.invalidate(),
      ]);
    },
  });
}

export interface CuratedCourtPhotoInput {
  url: string;
  displayOrder?: number;
}

export interface CuratedCourtUnitInput {
  label: string;
  sportId: string;
  tierLabel?: string | null;
}

export interface CuratedCourtData {
  name: string;
  address: string;
  city: string;
  latitude?: string | number;
  longitude?: string | number;
  extGPlaceId?: string;
  timeZone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  phoneNumber?: string;
  viberInfo?: string;
  websiteUrl?: string;
  otherContactInfo?: string;
  photos?: CuratedCourtPhotoInput[];
  amenities?: string[];
  courts: CuratedCourtUnitInput[];
}

export interface CuratedCourtBatchResultItem {
  index: number;
  status: "created" | "skipped_duplicate" | "error";
  placeId?: string;
  message?: string;
}

export interface CuratedCourtBatchResult {
  summary: {
    total: number;
    created: number;
    skipped: number;
    failed: number;
  };
  items: CuratedCourtBatchResultItem[];
}

export function useCreateCuratedCourt() {
  const utils = trpc.useUtils();

  return trpc.admin.court.createCurated.useMutation({
    onSuccess: async () => {
      await utils.admin.court.list.invalidate();
    },
  });
}

export function useCreateCuratedCourtsBatch() {
  const utils = trpc.useUtils();

  return trpc.admin.court.createCuratedBatch.useMutation({
    onSuccess: async () => {
      await utils.admin.court.list.invalidate();
    },
  });
}

export function useUpdateCuratedCourt() {
  const utils = trpc.useUtils();

  return trpc.admin.court.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.getById.invalidate(),
      ]);
    },
  });
}

export function useUploadAdminCourtPhoto(placeId: string) {
  const utils = trpc.useUtils();

  return trpc.admin.court.uploadPhoto.useMutation({
    onSuccess: async () => {
      await utils.admin.court.getById.invalidate({ placeId });
    },
  });
}

export function useRemoveAdminCourtPhoto(placeId: string) {
  const utils = trpc.useUtils();

  return trpc.admin.court.removePhoto.useMutation({
    onSuccess: async () => {
      await utils.admin.court.getById.invalidate({ placeId });
    },
  });
}

export function useCities() {
  const query = usePHProvincesCitiesQuery();

  const cities = useMemo(() => {
    if (!query.data) return [];

    const allCities = query.data.flatMap((province) =>
      province.cities.map((city) => ({
        name: city.name,
        displayName: city.displayName,
      })),
    );

    return Array.from(
      new Map(allCities.map((city) => [city.name, city])).values(),
    ).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [query.data]);

  return {
    ...query,
    data: cities,
  };
}

// ============================================================================
// From use-admin-dashboard.ts
// ============================================================================

export interface AdminStats {
  pendingClaims: number;
  pendingVerifications: number;
  totalCourts: number;
  reservableCourts: number;
  activeOrganizations: number;
}

export interface PendingClaim {
  id: string;
  placeId: string;
  organizationId: string | null;
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
 * Hook for sidebar badge stats only (claims + verifications).
 * Does NOT fetch court counts — use useAdminStats() for pages that display those.
 */
export function useAdminSidebarStats() {
  const claimsQuery = trpc.admin.claim.getPending.useQuery(
    { limit: 1, offset: 0 },
    { staleTime: 30_000 },
  );

  const verificationsQuery = trpc.admin.placeVerification.getPending.useQuery(
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
export function useAdminStats() {
  const claimsQuery = trpc.admin.claim.getPending.useQuery(
    { limit: 1, offset: 0 },
    { staleTime: 30_000 },
  );

  const verificationsQuery = trpc.admin.placeVerification.getPending.useQuery(
    { limit: 1, offset: 0 },
    { staleTime: 30_000 },
  );

  const courtStatsQuery = trpc.admin.court.stats.useQuery(undefined, {
    staleTime: 30_000,
  });

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
  const query = trpc.admin.claim.getPending.useQuery({
    limit,
    offset: 0,
  });

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
export function useAdminRecentActivity(limit?: number) {
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
          courtName: `Venue ${item.placeId.slice(0, 8)}...`,
          courtAddress: "Address pending...",
          courtStatus: "curated" as const,
          organizationId: item.organizationId ?? null,
          organizationName: item.organizationId
            ? `Org ${item.organizationId.slice(0, 8)}...`
            : "Guest request",
          ownerName: "Loading...",
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

// ============================================================================
// From use-place-verification.ts
// ============================================================================

export interface PlaceVerificationRequestListItem {
  id: string;
  placeId: string;
  placeName: string;
  organizationId: string | null;
  status: "pending" | "approved" | "rejected";
  requestedByUserId: string | null;
  requestNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewerUserId?: string | null;
}

export function usePlaceVerificationQueue(options: {
  page?: number;
  limit?: number;
}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const offset = (page - 1) * limit;

  const query = trpc.admin.placeVerification.getPending.useQuery(
    {
      limit,
      offset,
    },
    {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  );

  const data = query.data
    ? {
        items: query.data.items.map((item) => ({
          id: item.request.id,
          placeId: item.request.placeId,
          placeName: item.placeName,
          organizationId: item.request.organizationId,
          status: item.request.status.toLowerCase() as
            | "pending"
            | "approved"
            | "rejected",
          requestedByUserId: item.request.requestedByUserId,
          requestNotes: item.request.requestNotes,
          createdAt: item.request.createdAt,
          reviewedAt: item.request.reviewedAt,
          reviewerUserId: item.request.reviewerUserId,
        })),
        total: query.data.total,
        totalPages: Math.ceil(query.data.total / limit),
        page,
      }
    : undefined;

  return {
    ...query,
    data,
  };
}

export function usePlaceVerificationRequest(requestId: string) {
  const query = trpc.admin.placeVerification.getById.useQuery(
    { id: requestId },
    { enabled: !!requestId },
  );

  const data = query.data
    ? {
        request: query.data.request,
        place: query.data.place,
        organization: query.data.organization,
        documents: query.data.documents,
        events: query.data.events,
      }
    : undefined;

  return {
    ...query,
    data,
  };
}

export function useApprovePlaceVerification() {
  const utils = trpc.useUtils();

  return trpc.admin.placeVerification.approve.useMutation({
    onSuccess: async () => {
      toast.success("Verification approved");
      await utils.admin.placeVerification.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve verification");
    },
  });
}

export function useRejectPlaceVerification() {
  const utils = trpc.useUtils();

  return trpc.admin.placeVerification.reject.useMutation({
    onSuccess: async () => {
      toast.success("Verification rejected");
      await utils.admin.placeVerification.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject verification");
    },
  });
}
