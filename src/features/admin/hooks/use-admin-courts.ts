"use client";

import { useQuery } from "@tanstack/react-query";
import { CITIES } from "@/features/admin/schemas/curated-court.schema";
import { trpc } from "@/trpc/client";

export type CourtType = "curated" | "reservable";
export type CourtStatus = "active" | "inactive";
export type ClaimStatusFilter =
  | "unclaimed"
  | "claim_pending"
  | "claimed"
  | "removal_requested";

export interface AdminCourt {
  id: string;
  name: string;
  address: string;
  city: string;
  type: CourtType;
  status: CourtStatus;
  imageUrl?: string;
  organizationId?: string;
  organizationName?: string;
  claimStatus?: ClaimStatusFilter;
  createdAt: string;
  updatedAt: string;
}

interface UseAdminCourtsOptions {
  type?: CourtType | "all";
  status?: CourtStatus | "all";
  city?: string | "all";
  claimStatus?: ClaimStatusFilter | "all";
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

const toAdminCourt = (place: {
  id: string;
  name: string;
  address: string;
  city: string;
  placeType: "CURATED" | "RESERVABLE";
  claimStatus: "UNCLAIMED" | "CLAIM_PENDING" | "CLAIMED" | "REMOVAL_REQUESTED";
  isActive: boolean;
  organizationId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}): AdminCourt => ({
  id: place.id,
  name: place.name,
  address: place.address,
  city: place.city,
  type: place.placeType === "CURATED" ? "curated" : "reservable",
  status: place.isActive ? "active" : "inactive",
  organizationId: place.organizationId ?? undefined,
  claimStatus: toClaimStatusFilter(place.claimStatus),
  createdAt: toIsoString(place.createdAt),
  updatedAt: toIsoString(place.updatedAt),
});

type AdminCourtPlace = Parameters<typeof toAdminCourt>[0];
type AdminCourtListItem = { place: AdminCourtPlace };

export function useAdminCourts(options: UseAdminCourtsOptions = {}) {
  const {
    type,
    status,
    city,
    claimStatus,
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

  const query = trpc.admin.court.list.useQuery({
    limit,
    offset,
    placeType: placeTypeInput,
    isActive: status && status !== "all" ? status === "active" : undefined,
    city: city && city !== "all" ? city : undefined,
    claimStatus: claimStatusInput,
    search: search || undefined,
  });

  const total = query.data?.total ?? 0;
  const courts =
    query.data?.items.map((item: AdminCourtListItem) =>
      toAdminCourt(item.place),
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
  const query = trpc.admin.court.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!courtId },
  );

  const court = query.data?.items.find(
    (item: AdminCourtListItem) => item.place.id === courtId,
  );

  return {
    ...query,
    data: court ? toAdminCourt(court.place) : undefined,
  };
}

export function useToggleCourtStatus() {
  const utils = trpc.useUtils();
  const activateMutation = trpc.admin.court.activate.useMutation({
    onSuccess: async () => {
      await utils.admin.court.list.invalidate();
    },
  });
  const deactivateMutation = trpc.admin.court.deactivate.useMutation({
    onSuccess: async () => {
      await utils.admin.court.list.invalidate();
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
    if (status === "active") {
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
  timeZone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
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
      await utils.admin.court.list.invalidate();
    },
  });
}

export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return CITIES;
    },
  });
}
