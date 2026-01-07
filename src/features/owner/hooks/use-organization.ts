"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

// Mock data
const mockOrganization: Organization = {
  id: "org-1",
  name: "My Sports Complex",
  slug: "my-sports-complex",
  description:
    "Premium pickleball courts in the heart of Manila. We offer top-notch facilities for players of all levels.",
  logoUrl: "https://placehold.co/200x200?text=Logo",
  email: "contact@mysportscomplex.com",
  phone: "09171234567",
  address: "123 Sports Ave, Makati City",
  createdAt: new Date().toISOString(),
};

export function useOrganization(orgId?: string) {
  return useQuery({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockOrganization;
    },
    enabled: !!orgId,
  });
}

export function useCurrentOrganization() {
  return useQuery({
    queryKey: ["organization", "current"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockOrganization;
    },
  });
}

export interface UpdateOrganizationData {
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateOrganizationData) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { ...mockOrganization, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}

export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real implementation, this would upload to storage
      return { url: URL.createObjectURL(file) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}

export interface RemovalRequestData {
  reason: string;
  acknowledgeReservations: boolean;
  acknowledgeApproval: boolean;
}

export function useRequestRemoval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RemovalRequestData) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, requestId: `removal-${Date.now()}` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}

// Check if slug is available
export function useCheckSlug() {
  return useMutation({
    mutationFn: async (slug: string) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Mock: some slugs are taken
      const takenSlugs = ["test", "admin", "owner", "courts"];
      return { available: !takenSlugs.includes(slug.toLowerCase()) };
    },
  });
}
