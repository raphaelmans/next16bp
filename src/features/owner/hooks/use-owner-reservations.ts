"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Reservation {
  id: string;
  courtId: string;
  courtName: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  amountCents: number;
  currency: string;
  status: ReservationStatus;
  paymentReference?: string;
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
}

interface UseOwnerReservationsOptions {
  courtId?: string;
  status?: ReservationStatus | "all";
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Map frontend status to backend enum value
 */
function mapStatusToBackend(
  status?: ReservationStatus,
):
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | undefined {
  if (!status) return undefined;
  const map: Record<
    ReservationStatus,
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED"
  > = {
    pending: "PAYMENT_MARKED_BY_USER",
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    completed: "CONFIRMED", // No separate completed status
  };
  return map[status];
}

/**
 * Map backend status to frontend status
 */
function mapStatusFromBackend(status: string): ReservationStatus {
  const map: Record<string, ReservationStatus> = {
    CREATED: "pending",
    AWAITING_PAYMENT: "pending",
    PAYMENT_MARKED_BY_USER: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    EXPIRED: "cancelled",
  };
  return map[status] ?? "pending";
}

/**
 * Fetch reservations for an organization
 * Uses reservationOwner.getForOrganization endpoint
 *
 * Note: The backend returns basic ReservationRecord without slot/court details.
 * For now, we display what data we have - court/time info will show placeholder
 * until the backend is enhanced to return richer data.
 */
export function useOwnerReservations(
  organizationId: string | null,
  options: UseOwnerReservationsOptions = {},
) {
  const trpc = useTRPC();
  const { courtId, status, search } = options;

  return useQuery({
    ...trpc.reservationOwner.getForOrganization.queryOptions({
      organizationId: organizationId!,
      courtId: courtId || undefined,
      status: status !== "all" ? mapStatusToBackend(status) : undefined,
      limit: 100,
      offset: 0,
    }),
    enabled: !!organizationId,
    select: (data) => {
      // Map backend records to frontend Reservation format
      let reservations: Reservation[] = data.map((r) => ({
        id: r.id,
        // These will be empty/placeholder until backend provides slot/court data
        courtId: "",
        courtName: "Court",
        playerName: r.playerNameSnapshot ?? "Unknown",
        playerEmail: r.playerEmailSnapshot ?? "",
        playerPhone: r.playerPhoneSnapshot ?? "",
        // Using createdAt as date for now since we don't have slot data
        date: r.createdAt
          ? new Date(r.createdAt).toISOString().split("T")[0]
          : "",
        startTime: "--:--",
        endTime: "--:--",
        amountCents: 0,
        currency: "PHP",
        status: mapStatusFromBackend(r.status),
        paymentReference: undefined,
        paymentProofUrl: undefined,
        notes: r.cancellationReason ?? undefined,
        createdAt: r.createdAt ?? "",
      }));

      // Apply client-side search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        reservations = reservations.filter(
          (r) =>
            r.playerName.toLowerCase().includes(searchLower) ||
            r.playerEmail.toLowerCase().includes(searchLower) ||
            r.playerPhone.includes(search),
        );
      }

      return reservations;
    },
  });
}

/**
 * Confirm payment for a reservation
 */
export function useConfirmReservation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservationOwner.confirmPayment.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reservationOwner"],
      });
    },
  });
}

/**
 * Reject a reservation
 */
export function useRejectReservation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservationOwner.reject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reservationOwner"],
      });
    },
  });
}

/**
 * Get reservation counts
 */
export function useReservationCounts(organizationId: string | null) {
  const trpc = useTRPC();

  const { data: pendingCount } = useQuery({
    ...trpc.reservationOwner.getPendingCount.queryOptions({
      organizationId: organizationId!,
    }),
    enabled: !!organizationId,
  });

  return {
    data: {
      pending: pendingCount ?? 0,
      // Other counts would need additional queries or backend support
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      total: pendingCount ?? 0,
    },
  };
}
