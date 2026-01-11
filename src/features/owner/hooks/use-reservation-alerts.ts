"use client";

import { useOwnerReservations } from "./use-owner-reservations";

export function useReservationAlerts(
  organizationId: string | null,
  courtId?: string,
) {
  return useOwnerReservations(organizationId, {
    courtId,
    status: "all",
    refetchIntervalMs: 15000,
  });
}
