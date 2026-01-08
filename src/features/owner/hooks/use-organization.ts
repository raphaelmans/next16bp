"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

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
export function useOrganization(orgId?: string) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.organization.get.queryOptions({ id: orgId! }),
    enabled: !!orgId,
  });
}

/**
 * Fetch the current user's organization with profile data
 * Note: organization.my returns OrganizationRecord[] without profile
 * We need to fetch the full org data including profile via organization.get
 */
export function useCurrentOrganization() {
  const trpc = useTRPC();

  // First get the list of organizations
  const {
    data: organizations,
    isLoading: listLoading,
    ...rest
  } = useQuery(trpc.organization.my.queryOptions());

  const firstOrgId = organizations?.[0]?.id;

  // Then fetch the first organization with full details including profile
  const { data: fullOrg, isLoading: fullLoading } = useQuery({
    ...trpc.organization.get.queryOptions({ id: firstOrgId! }),
    enabled: !!firstOrgId,
  });

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
export function useUpdateOrganization() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Create separate mutation options for each endpoint
  const updateOrgMutation = useMutation({
    ...trpc.organization.update.mutationOptions(),
  });

  const updateProfileMutation = useMutation({
    ...trpc.organization.updateProfile.mutationOptions(),
    onSuccess: () => {
      // Invalidate after profile update (last step)
      queryClient.invalidateQueries({
        queryKey: trpc.organization.my.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: ["organization", "get"],
      });
    },
  });

  return useMutation({
    mutationFn: async (data: UpdateOrganizationData) => {
      // Update basic org info
      await updateOrgMutation.mutateAsync({
        id: data.organizationId,
        name: data.name,
        slug: data.slug,
      });

      // Update profile
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
 * Coming Soon - requires Supabase Storage setup
 */
export function useUploadOrganizationLogo() {
  return useMutation({
    mutationFn: async (_file: File) => {
      // Coming Soon - requires Supabase Storage setup
      throw new Error("Coming Soon");
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
export function useRequestRemoval() {
  return useMutation({
    mutationFn: async (data: RemovalRequestData) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, requestId: `removal-${Date.now()}` };
    },
  });
}

/**
 * Check if a slug is available
 * Keep as mock for now - could wire to real endpoint
 */
export function useCheckSlug() {
  return useMutation({
    mutationFn: async (slug: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const takenSlugs = ["test", "admin", "owner", "courts"];
      return { available: !takenSlugs.includes(slug.toLowerCase()) };
    },
  });
}
