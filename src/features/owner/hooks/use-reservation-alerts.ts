"use client";

import { useOwnerReservations } from "./use-owner-reservations";

export function useReservationAlerts(
  organizationId: string | null,
  options: {
    placeId?: string;
    courtId?: string;
  } = {},
) {
  return useOwnerReservations(organizationId, {
    placeId: options.placeId,
    courtId: options.courtId,
    status: "all",
    refetchIntervalMs: 15000,
  });
}
