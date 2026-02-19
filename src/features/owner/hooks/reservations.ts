"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";
import { useQueryOwnerCourts } from "./courts";

const ownerApi = getOwnerApi();

export const OWNER_UNRESOLVED_REFRESH_INTERVAL_MS = 15_000;
export const OWNER_UNRESOLVED_REFRESH_INTERVAL_SECONDS =
  OWNER_UNRESOLVED_REFRESH_INTERVAL_MS / 1000;

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

type OwnerReservationRecord = {
  id: string;
  courtId: string;
  courtName: string;
  playerNameSnapshot?: string | null;
  playerEmailSnapshot?: string | null;
  playerPhoneSnapshot?: string | null;
  slotStartTime?: string | null;
  slotEndTime?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  status:
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED";
  expiresAt?: string | null;
  paymentProof?: PaymentProofLike;
  cancellationReason?: string | null;
  createdAt?: string | null;
};

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
  if (!status || status === "pending") return undefined;

  const map: Record<
    Exclude<ReservationStatus, "pending">,
    "CONFIRMED" | "EXPIRED" | "CANCELLED"
  > = {
    confirmed: "CONFIRMED",
    cancelled: "CANCELLED",
    completed: "CONFIRMED",
  };
  return map[status];
}

function mapStatusFromBackend(
  status:
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED",
): ReservationStatus {
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

function mapOwnerReservationRecord(
  record: OwnerReservationRecord,
): Reservation {
  return {
    id: record.id,
    courtId: record.courtId,
    courtName: record.courtName,
    playerName: record.playerNameSnapshot ?? "Unknown",
    playerEmail: record.playerEmailSnapshot ?? "",
    playerPhone: record.playerPhoneSnapshot ?? "",
    date: record.slotStartTime
      ? new Date(record.slotStartTime).toISOString().split("T")[0]
      : record.createdAt
        ? new Date(record.createdAt).toISOString().split("T")[0]
        : "",
    startTime: record.slotStartTime
      ? formatTime(record.slotStartTime)
      : "--:--",
    endTime: record.slotEndTime ? formatTime(record.slotEndTime) : "--:--",
    slotStartTime: record.slotStartTime ?? null,
    slotEndTime: record.slotEndTime ?? null,
    amountCents: record.amountCents ?? 0,
    currency: record.currency ?? "PHP",
    status: mapStatusFromBackend(record.status),
    reservationStatus: record.status,
    expiresAt: record.expiresAt ?? null,
    paymentProof: normalizePaymentProof(record.paymentProof, record.createdAt),
    notes: record.cancellationReason ?? undefined,
    createdAt: record.createdAt ?? "",
  };
}

export function useQueryOwnerStats(organizationId: string | null) {
  const { data: courts = [], isLoading: courtsLoading } =
    useQueryOwnerCourts(organizationId);

  const pendingCountQuery = useFeatureQuery(
    ["reservationOwner", "getPendingCount"],
    ownerApi.queryReservationOwnerGetPendingCount,
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
      refetchInterval: OWNER_UNRESOLVED_REFRESH_INTERVAL_MS,
    },
  );

  const pendingCount = (pendingCountQuery.data as number | undefined) ?? 0;

  return {
    data: {
      activeCourts: courts.filter((court) => court.isActive).length,
      pendingReservations: pendingCount,
    },
    isLoading: courtsLoading || pendingCountQuery.isLoading,
  };
}

export function useModRecentActivity() {
  return {
    data: [],
    isLoading: false,
  };
}

export function useModTodaysBookings() {
  return {
    data: [],
    isLoading: false,
  };
}

export function useModOwnerReservations(
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

  return useFeatureQuery(
    ["reservationOwner", "getForOrganization"],
    ownerApi.queryReservationOwnerGetForOrganization,
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
      select: (data: unknown) => {
        let reservations = ((data as OwnerReservationRecord[]) ?? []).map(
          mapOwnerReservationRecord,
        );

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

        if (search) {
          const searchLower = search.toLowerCase();
          reservations = reservations.filter(
            (reservation) =>
              reservation.playerName.toLowerCase().includes(searchLower) ||
              reservation.playerEmail.toLowerCase().includes(searchLower) ||
              reservation.playerPhone.includes(search) ||
              reservation.courtName.toLowerCase().includes(searchLower),
          );
        }

        if (dateFrom) {
          const from = formatDate(dateFrom);
          reservations = reservations.filter(
            (reservation) => reservation.date && reservation.date >= from,
          );
        }

        if (dateTo) {
          const to = formatDate(dateTo);
          reservations = reservations.filter(
            (reservation) => reservation.date && reservation.date <= to,
          );
        }

        return reservations;
      },
    },
  );
}

export function useMutAcceptReservation() {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutReservationOwnerAccept, {
    onSuccess: async (_data, variables) => {
      const payload = variables as { reservationId?: string } | undefined;
      await Promise.all([
        utils.reservationOwner.getForOrganization.invalidate(),
        utils.reservationOwner.getPendingCount.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        payload?.reservationId
          ? utils.reservationChat.getSession.invalidate({
              reservationId: payload.reservationId,
            })
          : Promise.resolve(),
      ]);
    },
  });
}

export function useMutConfirmReservation() {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutReservationOwnerConfirmPayment, {
    onSuccess: async (_data, variables) => {
      const payload = variables as { reservationId?: string } | undefined;
      await Promise.all([
        utils.reservationOwner.getForOrganization.invalidate(),
        utils.reservationOwner.getPendingCount.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        payload?.reservationId
          ? utils.reservationChat.getSession.invalidate({
              reservationId: payload.reservationId,
            })
          : Promise.resolve(),
      ]);
    },
  });
}

export function useMutRejectReservation() {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutReservationOwnerReject, {
    onSuccess: async (_data, variables) => {
      const payload = variables as { reservationId?: string } | undefined;
      await Promise.all([
        utils.reservationOwner.getForOrganization.invalidate(),
        utils.reservationOwner.getPendingCount.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        payload?.reservationId
          ? utils.reservationChat.getSession.invalidate({
              reservationId: payload.reservationId,
            })
          : Promise.resolve(),
      ]);
    },
  });
}

export function useQueryReservationCounts(organizationId: string | null) {
  const pendingCountQuery = useFeatureQuery(
    ["reservationOwner", "getPendingCount"],
    ownerApi.queryReservationOwnerGetPendingCount,
    { organizationId: organizationId ?? "" },
    {
      enabled: !!organizationId,
      refetchInterval: OWNER_UNRESOLVED_REFRESH_INTERVAL_MS,
    },
  );

  const pendingCount = (pendingCountQuery.data as number | undefined) ?? 0;

  return {
    data: {
      pending: pendingCount,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
      total: pendingCount,
    },
  };
}

export function useModReservationAlerts(
  organizationId: string | null,
  options: {
    placeId?: string;
    courtId?: string;
  } = {},
) {
  return useModOwnerReservations(organizationId, {
    placeId: options.placeId,
    courtId: options.courtId,
    status: "all",
    refetchIntervalMs: OWNER_UNRESOLVED_REFRESH_INTERVAL_MS,
  });
}

export function useMutOwnerConfirmPaidOffline(
  options?: Record<string, unknown>,
) {
  const utils = trpc.useUtils();
  return useFeatureMutation(ownerApi.mutReservationOwnerConfirmPaidOffline, {
    ...(options ?? {}),
    onSuccess: async (_data, variables, context) => {
      const payload = variables as { reservationId?: string } | undefined;
      await Promise.all([
        utils.reservationOwner.getForOrganization.invalidate(),
        utils.reservationOwner.getPendingCount.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        payload?.reservationId
          ? utils.reservationChat.getSession.invalidate({
              reservationId: payload.reservationId,
            })
          : Promise.resolve(),
      ]);
      const userOnSuccess = options?.onSuccess;
      if (typeof userOnSuccess === "function") {
        await (userOnSuccess as (...args: unknown[]) => unknown)(
          _data,
          variables,
          context,
        );
      }
    },
  });
}

export function useQueryOwnerReservationHistory(input: {
  reservationId: string;
}) {
  return useFeatureQuery(
    ["audit", "reservationHistory"],
    ownerApi.queryAuditReservationHistory,
    input,
    { enabled: !!input.reservationId },
  );
}
