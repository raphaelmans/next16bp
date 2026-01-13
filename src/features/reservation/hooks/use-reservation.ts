"use client";

import type { ReservationStatus } from "@/shared/components/kudos";
import type { TimelineItem } from "@/shared/components/kudos/timeline";
import { trpc } from "@/trpc/client";

/**
 * Hook to fetch a single reservation by ID
 * Connected to reservation.getById tRPC endpoint
 */
export function useReservation(id: string) {
  return trpc.reservation.getById.useQuery(
    { reservationId: id },
    { enabled: !!id },
  );
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
