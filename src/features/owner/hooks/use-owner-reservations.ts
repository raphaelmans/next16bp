"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  reservationStatus:
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED";
  expiresAt?: string | null;
  paymentProof?: {
    referenceNumber: string | null;
    notes: string | null;
    fileUrl: string | null;
    createdAt: string;
  } | null;
  notes?: string;
  createdAt: string;
}

interface UseOwnerReservationsOptions {
  reservationId?: string;
  courtId?: string;
  status?: ReservationStatus | "all";
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  refetchIntervalMs?: number;
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
  if (status === "pending") {
    return undefined;
  }

  const map: Record<
    Exclude<ReservationStatus, "pending">,
    "CONFIRMED" | "EXPIRED" | "CANCELLED"
  > = {
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    completed: "CONFIRMED", // No separate completed status
  };
  return map[status as Exclude<ReservationStatus, "pending">];
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
 * Format ISO datetime string to time (e.g., "2:00 PM")
 */
function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "--:--";
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Fetch reservations for an organization
 * Uses reservationOwner.getForOrganization endpoint
 *
 * Backend returns enriched data with court/slot details.
 */
export function useOwnerReservations(
  organizationId: string | null,
  options: UseOwnerReservationsOptions = {},
) {
  const trpc = useTRPC();
  const {
    courtId,
    dateFrom,
    dateTo,
    status,
    search,
    reservationId,
    refetchIntervalMs,
  } = options;

  return useQuery({
    ...trpc.reservationOwner.getForOrganization.queryOptions({
      organizationId: organizationId ?? "",
      reservationId: reservationId || undefined,
      courtId: courtId || undefined,
      status:
        status && status !== "all" ? mapStatusToBackend(status) : undefined,
      limit: 100,
      offset: 0,
    }),
    enabled: !!organizationId,
    refetchInterval: refetchIntervalMs,
    select: (data) => {
      // Map backend records to frontend Reservation format
      let reservations: Reservation[] = data.map((r) => ({
        id: r.id,
        courtId: r.courtId,
        courtName: r.courtName,
        playerName: r.playerNameSnapshot ?? "Unknown",
        playerEmail: r.playerEmailSnapshot ?? "",
        playerPhone: r.playerPhoneSnapshot ?? "",
        // Extract date from slotStartTime
        date: r.slotStartTime
          ? new Date(r.slotStartTime).toISOString().split("T")[0]
          : r.createdAt
            ? new Date(r.createdAt).toISOString().split("T")[0]
            : "",
        startTime: r.slotStartTime ? formatTime(r.slotStartTime) : "--:--",
        endTime: r.slotEndTime ? formatTime(r.slotEndTime) : "--:--",
        amountCents: r.amountCents ?? 0,
        currency: r.currency ?? "PHP",
        status: mapStatusFromBackend(r.status),
        reservationStatus: r.status,
        expiresAt: r.expiresAt ?? null,
        paymentProof: r.paymentProof ?? null,
        notes: r.cancellationReason ?? undefined,
        createdAt: r.createdAt ?? "",
      }));

      if (status === "pending") {
        const pendingStatuses = new Set([
          "CREATED",
          "AWAITING_PAYMENT",
          "PAYMENT_MARKED_BY_USER",
        ]);
        reservations = reservations.filter((reservation) =>
          pendingStatuses.has(reservation.reservationStatus),
        );
      }

      // Apply client-side search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        reservations = reservations.filter(
          (r) =>
            r.playerName.toLowerCase().includes(searchLower) ||
            r.playerEmail.toLowerCase().includes(searchLower) ||
            r.playerPhone.includes(search) ||
            r.courtName.toLowerCase().includes(searchLower),
        );
      }

      if (dateFrom) {
        const from = formatDate(dateFrom);
        reservations = reservations.filter((r) => r.date && r.date >= from);
      }

      if (dateTo) {
        const to = formatDate(dateTo);
        reservations = reservations.filter((r) => r.date && r.date <= to);
      }

      return reservations;
    },
  });
}

/**
 * Accept a reservation (owner review)
 */
export function useAcceptReservation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.reservationOwner.accept.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(
        trpc.reservationOwner.getForOrganization.queryFilter(),
      );
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
      queryClient.invalidateQueries(
        trpc.reservationOwner.getForOrganization.queryFilter(),
      );
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
      queryClient.invalidateQueries(
        trpc.reservationOwner.getForOrganization.queryFilter(),
      );
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
      organizationId: organizationId ?? "",
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
