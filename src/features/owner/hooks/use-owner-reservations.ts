"use client";

import { trpc } from "@/trpc/client";

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
  slotStartTime?: string | null;
  slotEndTime?: string | null;
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

type PaymentProofLike = {
  referenceNumber?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  fileUrl?: string | null;
  file_url?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
} | null;

interface UseOwnerReservationsOptions {
  reservationId?: string;
  placeId?: string;
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

function normalizePaymentProof(
  proof: PaymentProofLike | undefined,
  fallbackCreatedAt?: string | null,
): Reservation["paymentProof"] | null {
  if (!proof) return null;

  const referenceNumber =
    proof.referenceNumber ?? proof.reference_number ?? null;
  const notes = proof.notes ?? null;
  const fileUrl = proof.fileUrl ?? proof.file_url ?? null;
  const createdAt =
    proof.createdAt ?? proof.created_at ?? fallbackCreatedAt ?? null;
  const hasContent = referenceNumber || notes || fileUrl;

  if (!hasContent) return null;

  return {
    referenceNumber,
    notes,
    fileUrl,
    createdAt: createdAt ?? "",
  };
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
  const {
    courtId,
    dateFrom,
    dateTo,
    status,
    search,
    reservationId,
    refetchIntervalMs,
    placeId,
  } = options;

  return trpc.reservationOwner.getForOrganization.useQuery(
    {
      organizationId: organizationId ?? "",
      reservationId: reservationId || undefined,
      placeId: placeId || undefined,
      courtId: courtId || undefined,
      status:
        status && status !== "all" ? mapStatusToBackend(status) : undefined,
      limit: 100,
      offset: 0,
    },
    {
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
          slotStartTime: r.slotStartTime ?? null,
          slotEndTime: r.slotEndTime ?? null,
          amountCents: r.amountCents ?? 0,
          currency: r.currency ?? "PHP",
          status: mapStatusFromBackend(r.status),
          reservationStatus: r.status,
          expiresAt: r.expiresAt ?? null,
          paymentProof: normalizePaymentProof(r.paymentProof, r.createdAt),
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
    },
  );
}

/**
 * Accept a reservation (owner review)
 */
export function useAcceptReservation() {
  const utils = trpc.useUtils();

  return trpc.reservationOwner.accept.useMutation({
    onSuccess: async () => {
      await utils.reservationOwner.getForOrganization.invalidate();
    },
  });
}

/**
 * Confirm payment for a reservation
 */
export function useConfirmReservation() {
  const utils = trpc.useUtils();

  return trpc.reservationOwner.confirmPayment.useMutation({
    onSuccess: async () => {
      await utils.reservationOwner.getForOrganization.invalidate();
    },
  });
}

/**
 * Reject a reservation
 */
export function useRejectReservation() {
  const utils = trpc.useUtils();

  return trpc.reservationOwner.reject.useMutation({
    onSuccess: async () => {
      await utils.reservationOwner.getForOrganization.invalidate();
    },
  });
}

/**
 * Get reservation counts
 */
export function useReservationCounts(organizationId: string | null) {
  const { data: pendingCount } = trpc.reservationOwner.getPendingCount.useQuery(
    { organizationId: organizationId ?? "" },
    { enabled: !!organizationId },
  );

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
