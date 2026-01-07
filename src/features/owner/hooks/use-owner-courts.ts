"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface OwnerCourt {
  id: string;
  name: string;
  address: string;
  city: string;
  coverImageUrl?: string;
  status: "active" | "draft" | "inactive";
  openSlots: number;
  totalSlots: number;
  createdAt: Date | string;
}

/**
 * Mock data for owner courts.
 * Replace with actual tRPC queries when backend is ready.
 */
const mockCourts: OwnerCourt[] = [
  {
    id: "1",
    name: "Court A - Main Building",
    address: "123 Sports Street",
    city: "Metro Manila",
    coverImageUrl: undefined,
    status: "active",
    openSlots: 12,
    totalSlots: 20,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: "2",
    name: "Court B - Outdoor",
    address: "123 Sports Street",
    city: "Metro Manila",
    coverImageUrl: undefined,
    status: "active",
    openSlots: 8,
    totalSlots: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
  },
  {
    id: "3",
    name: "Court C - Premium",
    address: "123 Sports Street",
    city: "Metro Manila",
    coverImageUrl: undefined,
    status: "draft",
    openSlots: 0,
    totalSlots: 10,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
];

export function useOwnerCourts() {
  return useQuery({
    queryKey: ["owner", "courts"],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockCourts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useOwnerCourt(courtId: string) {
  return useQuery({
    queryKey: ["owner", "courts", courtId],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockCourts.find((c) => c.id === courtId) ?? null;
    },
    enabled: !!courtId,
  });
}

export function useDeactivateCourt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courtId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, courtId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "courts"] });
    },
  });
}
