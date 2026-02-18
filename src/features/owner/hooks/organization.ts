"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  createFeatureQueryOptions,
  useFeatureMutation,
  useFeatureQueries,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { toast } from "@/common/toast";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";

const ownerApi = getOwnerApi();

export function useQueryOrganizationPaymentMethods(organizationId?: string) {
  return useFeatureQuery(
    ["organizationPayment", "listMethods"],
    ownerApi.queryOrganizationPaymentListMethods,
    { organizationId: organizationId ?? "" },
    { enabled: !!organizationId },
  );
}

export function useMutCreateOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return useFeatureMutation(ownerApi.mutOrganizationPaymentCreateMethod, {
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

export function useMutUpdateOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return useFeatureMutation(ownerApi.mutOrganizationPaymentUpdateMethod, {
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

export function useMutDeleteOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return useFeatureMutation(ownerApi.mutOrganizationPaymentDeleteMethod, {
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

export function useMutSetDefaultOrganizationPaymentMethod(
  organizationId: string,
) {
  const utils = trpc.useUtils();
  return useFeatureMutation(ownerApi.mutOrganizationPaymentSetDefault, {
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

// ============================================================================
// From use-organization.ts
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface UpdateOrganizationData {
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Fetch an organization by ID
 */
export function useQueryOrganization(orgId?: string) {
  return useFeatureQuery(
    ["organization", "get"],
    ownerApi.queryOrganizationGet,
    { id: orgId ?? "" },
    { enabled: !!orgId },
  );
}

/**
 * Fetch the current user's organization with profile data
 * Note: organization.my returns OrganizationRecord[] without profile
 * We need to fetch the full org data including profile via organization.get
 */
export function useQueryCurrentOrganization() {
  // First get the list of organizations
  const {
    data: organizations,
    isLoading: listLoading,
    ...rest
  } = useFeatureQuery(["organization", "my"], ownerApi.queryOrganizationMy);

  const firstOrgId = organizations?.[0]?.id;

  // Then fetch the first organization with full details including profile
  const { data: fullOrg, isLoading: fullLoading } = useFeatureQuery(
    ["organization", "get"],
    ownerApi.queryOrganizationGet,
    { id: firstOrgId ?? "" },
    { enabled: !!firstOrgId },
  );

  const org = fullOrg?.organization;
  const profile = fullOrg?.profile;

  return {
    data: org
      ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
          description: profile?.description ?? "",
          logoUrl: profile?.logoUrl ?? undefined,
          email: profile?.contactEmail ?? "",
          phone: profile?.contactPhone ?? "",
          address: profile?.address ?? "",
          createdAt: org.createdAt,
        }
      : null,
    isLoading: listLoading || fullLoading,
    ...rest,
  };
}

/**
 * Update organization details
 * Makes two mutation calls: one for basic info, one for profile
 */
export function useMutUpdateOrganization() {
  const utils = trpc.useUtils();

  const updateOrgMutation = useFeatureMutation(ownerApi.mutOrganizationUpdate);
  const updateProfileMutation = useFeatureMutation(
    ownerApi.mutOrganizationUpdateProfile,
    {
      onSuccess: async () => {
        await Promise.all([
          utils.organization.my.invalidate(),
          utils.organization.get.invalidate(),
        ]);
      },
    },
  );

  return useMutation({
    mutationFn: async (data: UpdateOrganizationData) => {
      await updateOrgMutation.mutateAsync({
        id: data.organizationId,
        name: data.name,
        slug: data.slug,
      });

      await updateProfileMutation.mutateAsync({
        organizationId: data.organizationId,
        description: data.description,
        contactEmail: data.email || null,
        contactPhone: data.phone || null,
        address: data.address || null,
      });

      return { success: true };
    },
  });
}

/**
 * Upload organization logo
 */
export function useMutUploadOrganizationLogo(organizationId: string) {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutOrganizationUploadLogo, {
    onSuccess: async () => {
      toast.success("Logo uploaded successfully");
      await Promise.all([
        utils.organization.get.invalidate({ id: organizationId }),
        utils.organization.my.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload logo");
    },
  });
}

export interface RemovalRequestData {
  reason: string;
  acknowledgeReservations: boolean;
  acknowledgeApproval: boolean;
}

/**
 * Request listing removal
 * Keep as mock for now
 */
export function useMutRequestRemoval() {
  return useMutation({
    mutationFn: async (_data: RemovalRequestData) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, requestId: `removal-${Date.now()}` };
    },
  });
}

/**
 * Check if a slug is available
 * Keep as mock for now - could wire to real endpoint
 */
export function useMutCheckSlug() {
  return useMutation({
    mutationFn: async (slug: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const takenSlugs = ["test", "admin", "owner", "courts"];
      return { available: !takenSlugs.includes(slug.toLowerCase()) };
    },
  });
}

export function useQueryOwnerOrganization() {
  const {
    data: organizations,
    isLoading,
    error,
    refetch,
  } = useFeatureQuery(["organization", "my"], ownerApi.queryOrganizationMy);

  const organization = organizations?.[0] ?? null;

  return {
    /** The owner's primary organization (or null if none) */
    organization,
    /** Organization ID for use in other queries */
    organizationId: organization?.id ?? null,
    /** All organizations (for future multi-org support) */
    organizations: organizations ?? [],
    /** Whether the query is loading */
    isLoading,
    /** Whether the user is an owner (has at least one organization) */
    isOwner: !!organization,
    /** Query error if any */
    error,
    /** Refetch the organization data */
    refetch,
  };
}

export function useQueryOwnerSetupStatus() {
  return useFeatureQuery(
    ["ownerSetup", "getStatus"],
    ownerApi.queryOwnerSetupGetStatus,
    undefined,
    {
      staleTime: 0,
      refetchOnMount: "always",
    },
  );
}

// ============================================================================
// From use-owner-sidebar-quick-links.ts
// ============================================================================

export interface OwnerSidebarCourt {
  id: string;
  label: string;
}

export interface OwnerSidebarPlace {
  id: string;
  name: string;
  courts: OwnerSidebarCourt[];
}

type OwnerSidebarPlaceRecord = Pick<OwnerPlaceBase, "id" | "name"> & {
  verification?: {
    status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | null;
    reservationsEnabled: boolean | null;
  } | null;
};

const mapOwnerSidebarPlace = (
  place: OwnerSidebarPlaceRecord,
  courts: CourtWithSportPayload[],
): OwnerSidebarPlace => {
  const activeCourts = courts
    .filter((court) => court.court.isActive)
    .map((court) => ({
      id: court.court.id,
      label: court.court.label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    id: place.id,
    name: place.name,
    courts: activeCourts,
  };
};

export function useQueryOwnerSidebarQuickLinks(organizationId?: string | null) {
  const placesQuery = useFeatureQuery(
    ["placeManagement", "list"],
    ownerApi.queryPlaceManagementList,
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
    },
  );

  const courtQueries = useFeatureQueries(
    (placesQuery.data ?? []).map((place) =>
      createFeatureQueryOptions(
        ["courtManagement", "listByPlace"],
        ownerApi.queryCourtManagementListByPlace,
        { placeId: place.id },
      ),
    ),
  );

  const isCourtsLoading = courtQueries.some((query) => query.isLoading);

  const data = useMemo(() => {
    if (!placesQuery.data) return [];

    return placesQuery.data.map((place, index) =>
      mapOwnerSidebarPlace(place, courtQueries[index]?.data ?? []),
    );
  }, [courtQueries, placesQuery.data]);

  return {
    ...placesQuery,
    data,
    isLoading: placesQuery.isLoading || isCourtsLoading,
  };
}

export function useQueryOwnerOrganizations(
  input?: unknown,
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["organization", "my"],
    ownerApi.queryOrganizationMy,
    input,
    options,
  );
}

export function useQueryOwnerOrganizationDetails(
  input?: unknown,
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["organization", "get"],
    ownerApi.queryOrganizationGet,
    input,
    options,
  );
}
