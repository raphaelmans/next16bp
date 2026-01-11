"use client";

import { useOwnerReservations } from "./use-owner-reservations";

export function useReservationAlerts(organizationId: string | null) {
  return useOwnerReservations(organizationId, {
    status: "all",
    refetchIntervalMs: 15000,
  });
}
