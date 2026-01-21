"use client";

import { useMemo } from "react";
import { usePHProvincesCitiesQuery } from "@/shared/lib/clients/ph-provinces-cities-client";
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
    province: province && province !== "all" ? province : undefined,
    city: city && city !== "all" ? city : undefined,
    claimStatus: claimStatusInput,
    search: search || undefined,
  });

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
