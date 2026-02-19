"use client";

import { useMemo } from "react";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getAdminApi } from "../api.runtime";

const adminApi = getAdminApi();

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
    provinceRank: number;
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

export function useModAdminCourts(options: UseAdminCourtsOptions = {}) {
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

  const query = useFeatureQuery(
    ["admin", "court", "list"],
    adminApi.queryAdminCourtList,
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

export function useQueryAdminCourt(courtId: string) {
  const query = useFeatureQuery(
    ["admin", "court", "getById"],
    adminApi.queryAdminCourtGetById,
    { placeId: courtId },
    { enabled: !!courtId },
  );

  return {
    ...query,
    data: query.data as AdminCourtDetail | undefined,
  };
}

export function useMutTransferPlaceToOrganization() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminCourtTransfer, {
    onSuccess: async (_data, variables) => {
      const placeId = (variables as { placeId: string }).placeId;
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.getById.invalidate({ placeId }),
      ]);
    },
  });
}

export function useMutRecuratePlace() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminCourtRecurate, {
    onSuccess: async (_data, variables) => {
      const placeId = (variables as { placeId: string }).placeId;
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.getById.invalidate({ placeId }),
      ]);
    },
  });
}

export function useMutToggleCourtStatus() {
  const utils = trpc.useUtils();
  const activateMutation = useFeatureMutation(adminApi.mutAdminCourtActivate, {
    onSuccess: async () => {
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.getById.invalidate(),
      ]);
    },
  });
  const deactivateMutation = useFeatureMutation(
    adminApi.mutAdminCourtDeactivate,
    {
      onSuccess: async () => {
        await Promise.all([
          utils.admin.court.list.invalidate(),
          utils.admin.court.getById.invalidate(),
        ]);
      },
    },
  );

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

export function useMutDeleteAdminPlace() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminCourtDeletePlace, {
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

export function useMutCreateCuratedCourt() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminCourtCreateCurated, {
    onSuccess: async () => {
      await utils.admin.court.list.invalidate();
    },
  });
}

export function useMutCreateCuratedCourtsBatch() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminCourtCreateCuratedBatch, {
    onSuccess: async () => {
      await utils.admin.court.list.invalidate();
    },
  });
}

export function useMutUpdateCuratedCourt() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminCourtUpdate, {
    onSuccess: async () => {
      await Promise.all([
        utils.admin.court.list.invalidate(),
        utils.admin.court.getById.invalidate(),
      ]);
    },
  });
}

export function useMutUploadAdminCourtPhoto(placeId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminCourtUploadPhoto, {
    onSuccess: async () => {
      await utils.admin.court.getById.invalidate({ placeId });
    },
  });
}

export function useMutRemoveAdminCourtPhoto(placeId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminCourtRemovePhoto, {
    onSuccess: async () => {
      await utils.admin.court.getById.invalidate({ placeId });
    },
  });
}

export function useModCities() {
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

export function useQueryAdminSports(
  input?: unknown,
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["sport", "list"],
    adminApi.querySportList,
    input,
    options,
  );
}

export function useMutAdminCourtUploadPhoto(options?: Record<string, unknown>) {
  return useFeatureMutation(adminApi.mutAdminCourtUploadPhoto, options);
}
