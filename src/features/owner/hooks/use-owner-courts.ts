"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Extended court type for owner dashboard display.
 * Maps from backend CourtRecord to UI-friendly format.
 */
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
  isActive: boolean;
}

/**
 * Fetch all courts owned by the current user.
 * Uses the courtManagement.getMyCourts endpoint.
 */
export function useOwnerCourts() {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.courtManagement.getMyCourts.queryOptions(),
    select: (courts) =>
      courts.map(
        (court): OwnerCourt => ({
          id: court.id,
          name: court.name,
          address: court.address,
          city: court.city,
          coverImageUrl: undefined, // TODO: Add when photos are loaded
          status: court.isActive ? "active" : "inactive",
          openSlots: 0, // TODO: Calculate from time slots
          totalSlots: 0, // TODO: Calculate from time slots
          createdAt: court.createdAt,
          isActive: court.isActive,
        }),
      ),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single court by ID.
 * Uses the courtManagement.getById endpoint.
 * Note: getById returns CourtWithDetails with nested 'court' property
 */
export function useOwnerCourt(courtId: string) {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.courtManagement.getById.queryOptions({ courtId }),
    enabled: !!courtId,
    select: (data): OwnerCourt | null =>
      data
        ? {
            id: data.court.id,
            name: data.court.name,
            address: data.court.address,
            city: data.court.city,
            coverImageUrl: data.photos?.[0]?.url,
            status: data.court.isActive ? "active" : "inactive",
            openSlots: 0,
            totalSlots: 0,
            createdAt: data.court.createdAt,
            isActive: data.court.isActive,
          }
        : null,
  });
}

/**
 * Deactivate a court.
 * Uses the courtManagement.deactivate endpoint.
 */
export function useDeactivateCourt() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.courtManagement.deactivate.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.courtManagement.getMyCourts.queryKey(),
      });
    },
  });
}
