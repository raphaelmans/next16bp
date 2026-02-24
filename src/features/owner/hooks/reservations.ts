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
  reservationGroupId?: string | null;
  isGroupPrimary?: boolean;
  groupItemCount?: number;
  groupItems?: Reservation[];
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
  reservationGroupId?: string | null;
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
    reservationGroupId: record.reservationGroupId ?? null,
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

function deriveGroupReservationStatus(
  reservations: Reservation[],
): Reservation["reservationStatus"] {
  const statuses = new Set(reservations.map((item) => item.reservationStatus));

  if (statuses.has("PAYMENT_MARKED_BY_USER")) {
    return "PAYMENT_MARKED_BY_USER";
  }
  if (statuses.has("CREATED")) {
    return "CREATED";
  }
  if (statuses.has("AWAITING_PAYMENT")) {
    return "AWAITING_PAYMENT";
  }
  if (statuses.has("CONFIRMED")) {
    return "CONFIRMED";
  }
  if (statuses.has("EXPIRED")) {
    return "EXPIRED";
  }
  return "CANCELLED";
}

function aggregateGroupedReservations(
  reservations: Reservation[],
): Reservation[] {
  const grouped = new Map<string, Reservation[]>();
  const singles: Reservation[] = [];

  for (const reservation of reservations) {
    if (!reservation.reservationGroupId) {
      singles.push(reservation);
      continue;
    }

    const existing = grouped.get(reservation.reservationGroupId) ?? [];
    existing.push(reservation);
    grouped.set(reservation.reservationGroupId, existing);
  }

  const groupRows: Reservation[] = [];

  for (const [reservationGroupId, items] of grouped.entries()) {
    const sortedItems = [...items].sort((a, b) => {
      const aStart = a.slotStartTime ? new Date(a.slotStartTime).getTime() : 0;
      const bStart = b.slotStartTime ? new Date(b.slotStartTime).getTime() : 0;
      return aStart - bStart;
    });
    const primary = sortedItems[0];
    const endItem = sortedItems[sortedItems.length - 1] ?? primary;
    const derivedStatus = deriveGroupReservationStatus(sortedItems);
    const totalAmountCents = sortedItems.reduce(
      (sum, item) => sum + item.amountCents,
      0,
    );
    const expiresAtCandidates = sortedItems
      .map((item) => item.expiresAt)
      .filter((value): value is string => Boolean(value))
      .sort();

    groupRows.push({
      ...primary,
      reservationGroupId,
      isGroupPrimary: true,
      groupItemCount: sortedItems.length,
      groupItems: sortedItems,
      courtName:
        sortedItems.length > 1
          ? `${primary.courtName.split(" - ")[0]} - ${sortedItems.length} courts`
          : primary.courtName,
      reservationStatus: derivedStatus,
      status: mapStatusFromBackend(derivedStatus),
      amountCents: totalAmountCents,
      slotStartTime: primary.slotStartTime,
      slotEndTime: endItem.slotEndTime,
      startTime: primary.startTime,
      endTime: endItem.endTime,
      expiresAt: expiresAtCandidates[0] ?? null,
    });
  }

  return [...singles, ...groupRows];
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

        reservations = aggregateGroupedReservations(reservations);

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

type ReservationActionInput = {
  reservationId: string;
  reservationGroupId?: string | null;
};

type ConfirmReservationActionInput = ReservationActionInput & {
  notes?: string;
};

type RejectReservationActionInput = ReservationActionInput & {
  reason: string;
};

export function useMutAcceptReservation() {
  const utils = trpc.useUtils();

  return useFeatureMutation(
    async (input: ReservationActionInput) => {
      if (input.reservationGroupId) {
        return ownerApi.mutReservationOwnerAcceptGroup({
          reservationGroupId: input.reservationGroupId,
        });
      }

      return ownerApi.mutReservationOwnerAccept({
        reservationId: input.reservationId,
      });
    },
    {
      onSuccess: async (_data, variables) => {
        const payload = variables as ReservationActionInput | undefined;
        await Promise.all([
          utils.reservationOwner.getForOrganization.invalidate(),
          utils.reservationOwner.getPendingCount.invalidate(),
          utils.reservationChat.getThreadMetas.invalidate(),
          payload?.reservationId && !payload?.reservationGroupId
            ? utils.reservationChat.getSession.invalidate({
                reservationId: payload.reservationId,
              })
            : Promise.resolve(),
          payload?.reservationGroupId
            ? utils.reservationChat.getGroupSession.invalidate({
                reservationGroupId: payload.reservationGroupId,
              })
            : Promise.resolve(),
        ]);
      },
    },
  );
}

export function useMutAcceptReservationGroup() {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutReservationOwnerAcceptGroup, {
    onSuccess: async () => {
      await Promise.all([
        utils.reservationOwner.getForOrganization.invalidate(),
        utils.reservationOwner.getPendingCount.invalidate(),
      ]);
    },
  });
}

export function useMutConfirmReservation() {
  const utils = trpc.useUtils();

  return useFeatureMutation(
    async (input: ConfirmReservationActionInput) => {
      if (input.reservationGroupId) {
        return ownerApi.mutReservationOwnerConfirmPaymentGroup({
          reservationGroupId: input.reservationGroupId,
          notes: input.notes,
        });
      }

      return ownerApi.mutReservationOwnerConfirmPayment({
        reservationId: input.reservationId,
        notes: input.notes,
      });
    },
    {
      onSuccess: async (_data, variables) => {
        const payload = variables as ConfirmReservationActionInput | undefined;
        await Promise.all([
          utils.reservationOwner.getForOrganization.invalidate(),
          utils.reservationOwner.getPendingCount.invalidate(),
          utils.reservationChat.getThreadMetas.invalidate(),
          payload?.reservationId && !payload?.reservationGroupId
            ? utils.reservationChat.getSession.invalidate({
                reservationId: payload.reservationId,
              })
            : Promise.resolve(),
          payload?.reservationGroupId
            ? utils.reservationChat.getGroupSession.invalidate({
                reservationGroupId: payload.reservationGroupId,
              })
            : Promise.resolve(),
        ]);
      },
    },
  );
}

export function useMutConfirmReservationGroup() {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutReservationOwnerConfirmPaymentGroup, {
    onSuccess: async () => {
      await Promise.all([
        utils.reservationOwner.getForOrganization.invalidate(),
        utils.reservationOwner.getPendingCount.invalidate(),
      ]);
    },
  });
}

export function useMutRejectReservation() {
  const utils = trpc.useUtils();

  return useFeatureMutation(
    async (input: RejectReservationActionInput) => {
      if (input.reservationGroupId) {
        return ownerApi.mutReservationOwnerRejectGroup({
          reservationGroupId: input.reservationGroupId,
          reason: input.reason,
        });
      }

      return ownerApi.mutReservationOwnerReject({
        reservationId: input.reservationId,
        reason: input.reason,
      });
    },
    {
      onSuccess: async (_data, variables) => {
        const payload = variables as RejectReservationActionInput | undefined;
        await Promise.all([
          utils.reservationOwner.getForOrganization.invalidate(),
          utils.reservationOwner.getPendingCount.invalidate(),
          utils.reservationChat.getThreadMetas.invalidate(),
          payload?.reservationId && !payload?.reservationGroupId
            ? utils.reservationChat.getSession.invalidate({
                reservationId: payload.reservationId,
              })
            : Promise.resolve(),
          payload?.reservationGroupId
            ? utils.reservationChat.getGroupSession.invalidate({
                reservationGroupId: payload.reservationGroupId,
              })
            : Promise.resolve(),
        ]);
      },
    },
  );
}

export function useMutRejectReservationGroup() {
  const utils = trpc.useUtils();

  return useFeatureMutation(ownerApi.mutReservationOwnerRejectGroup, {
    onSuccess: async () => {
      await Promise.all([
        utils.reservationOwner.getForOrganization.invalidate(),
        utils.reservationOwner.getPendingCount.invalidate(),
      ]);
    },
  });
}

export function useQueryReservationGroupDetail(reservationGroupId?: string) {
  return useFeatureQuery(
    ["reservationOwner", "getGroupDetail"],
    ownerApi.queryReservationOwnerGetGroupDetail,
    {
      reservationGroupId: reservationGroupId ?? "",
    },
    {
      enabled: !!reservationGroupId,
    },
  );
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
