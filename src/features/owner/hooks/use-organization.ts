"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";

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
  return trpc.organization.get.useQuery(
    { id: orgId ?? "" },
    { enabled: !!orgId },
  );
}

/**
 * Fetch the current user's organization with profile data
 * Note: organization.my returns OrganizationRecord[] without profile
 * We need to fetch the full org data including profile via organization.get
 */
export function useCurrentOrganization() {
  // First get the list of organizations
  const {
    data: organizations,
    isLoading: listLoading,
    ...rest
  } = trpc.organization.my.useQuery();

  const firstOrgId = organizations?.[0]?.id;

  // Then fetch the first organization with full details including profile
  const { data: fullOrg, isLoading: fullLoading } =
    trpc.organization.get.useQuery(
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
export function useUpdateOrganization() {
  const utils = trpc.useUtils();

  const updateOrgMutation = trpc.organization.update.useMutation();
  const updateProfileMutation = trpc.organization.updateProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.organization.my.invalidate(),
        utils.organization.get.invalidate(),
      ]);
    },
  });

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
export function useUploadOrganizationLogo(organizationId: string) {
  const utils = trpc.useUtils();

  return trpc.organization.uploadLogo.useMutation({
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
export function useRequestRemoval() {
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
export function useCheckSlug() {
  return useMutation({
    mutationFn: async (slug: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const takenSlugs = ["test", "admin", "owner", "courts"];
      return { available: !takenSlugs.includes(slug.toLowerCase()) };
    },
  });
}
