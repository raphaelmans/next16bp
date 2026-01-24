"use client";

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
