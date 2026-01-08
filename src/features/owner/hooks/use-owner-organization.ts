"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Shared hook for fetching the current user's organization.
 * Used across all owner dashboard pages for consistent organization context.
 *
 * Returns the first organization (owners currently can only have one).
 */
export function useOwnerOrganization() {
  const trpc = useTRPC();

  const {
    data: organizations,
    isLoading,
    error,
    refetch,
  } = useQuery(trpc.organization.my.queryOptions());

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
