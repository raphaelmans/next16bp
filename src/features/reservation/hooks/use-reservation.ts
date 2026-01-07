"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReservationStatus } from "@/shared/components/kudos";
import type { TimelineItem } from "@/shared/components/kudos/timeline";

/**
 * Hook to fetch a single reservation by ID
 * TODO: Connect to actual tRPC endpoint when backend is ready
 */
export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: async () => {
      // This will be replaced with actual API call
      return null as ReservationDetail | null;
    },
    enabled: !!id,
  });
}

export interface ReservationDetail {
  id: string;
  status: ReservationStatus;
  createdAt: string;
  expiresAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  court: {
    id: string;
    name: string;
    address: string;
    city: string;
    coverImageUrl?: string;
    latitude?: number;
    longitude?: number;
  };
  organization: {
    id: string;
    name: string;
    logoUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  timeSlot: {
    id: string;
    startTime: string;
    endTime: string;
    priceCents: number;
    currency: string;
  };
  paymentProof?: {
    id: string;
    referenceNumber?: string;
    fileUrl?: string;
    notes?: string;
    createdAt: string;
  };
  timeline: TimelineItem[];
}
