"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

// Mock data
const CITIES = ["Makati", "BGC", "Pasig", "Quezon City", "Manila", "Taguig"];

const generateMockAdminCourts = (): AdminCourt[] => {
  const types: CourtType[] = ["curated", "reservable"];
  const statuses: CourtStatus[] = ["active", "inactive"];
  const claimStatuses: (ClaimStatusFilter | undefined)[] = [
    "unclaimed",
    "claim_pending",
    "claimed",
    "removal_requested",
    undefined,
  ];

  const courts: AdminCourt[] = [];

  for (let i = 0; i < 30; i++) {
    const type = types[i % 2];
    const status = statuses[i % 5 === 0 ? 1 : 0]; // 20% inactive
    const city = CITIES[i % CITIES.length];
    const claimStatus =
      type === "curated"
        ? claimStatuses[i % 3]
        : i % 4 === 0
          ? "removal_requested"
          : "claimed";

    courts.push({
      id: `court-${i + 1}`,
      name: `${city} Pickleball Court ${i + 1}`,
      address: `${100 + i} Main Street, ${city}`,
      city,
      type,
      status,
      imageUrl: `https://placehold.co/400x300?text=Court+${i + 1}`,
      organizationId: type === "reservable" ? `org-${(i % 5) + 1}` : undefined,
      organizationName:
        type === "reservable"
          ? `Sports Organization ${(i % 5) + 1}`
          : undefined,
      claimStatus: claimStatus,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
    });
  }

  return courts;
};

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

  return useQuery({
    queryKey: [
      "admin",
      "courts",
      type,
      status,
      city,
      claimStatus,
      search,
      page,
      limit,
    ],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let courts = generateMockAdminCourts();

      // Apply filters
      if (type && type !== "all") {
        courts = courts.filter((c) => c.type === type);
      }
      if (status && status !== "all") {
        courts = courts.filter((c) => c.status === status);
      }
      if (city && city !== "all") {
        courts = courts.filter((c) => c.city === city);
      }
      if (claimStatus && claimStatus !== "all") {
        courts = courts.filter((c) => c.claimStatus === claimStatus);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        courts = courts.filter(
          (c) =>
            c.name.toLowerCase().includes(searchLower) ||
            c.address.toLowerCase().includes(searchLower) ||
            c.organizationName?.toLowerCase().includes(searchLower),
        );
      }

      // Pagination
      const total = courts.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedCourts = courts.slice(start, end);

      return {
        courts: paginatedCourts,
        total,
        page,
        totalPages,
      };
    },
  });
}

export function useAdminCourt(courtId: string) {
  return useQuery({
    queryKey: ["admin", "courts", courtId],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const courts = generateMockAdminCourts();
      const court = courts.find((c) => c.id === courtId);
      if (!court) throw new Error("Court not found");
      return court;
    },
    enabled: !!courtId,
  });
}

export function useToggleCourtStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courtId,
      status,
    }: {
      courtId: string;
      status: CourtStatus;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, courtId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "courts"] });
    },
  });
}

export interface CuratedCourtData {
  name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  facebookUrl?: string;
  instagramUrl?: string;
  viberContact?: string;
  websiteUrl?: string;
  otherContactInfo?: string;
  amenities: string[];
}

export function useCreateCuratedCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CuratedCourtData) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, courtId: `court-new-${Date.now()}` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "courts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useUpdateCuratedCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courtId,
      data,
    }: {
      courtId: string;
      data: Partial<CuratedCourtData>;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, courtId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "courts"] });
    },
  });
}

// Get available cities for filter dropdown
export function useCities() {
  return useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return CITIES;
    },
  });
}
