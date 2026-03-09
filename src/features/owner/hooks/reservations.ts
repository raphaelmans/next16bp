"use client";

import { format as formatDateValue } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { formatTimeInTimeZone } from "@/common/format";
import { normalizeOwnerReservationScopeInput } from "@/common/query-keys";
import { getZonedDayKey } from "@/common/time-zone";
import { getReservationRealtimeApi } from "@/features/reservation/realtime-api.runtime";
import { useModReservationSync } from "@/features/reservation/sync";
import { trpc } from "@/trpc/client";
import { getOwnerApi } from "../api.runtime";
import { useQueryOwnerCourts } from "./courts";

const ownerApi = getOwnerApi();
const reservationRealtimeApi = getReservationRealtimeApi();

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
  placeId: string;
  placeName: string;
  placeTimeZone: string;
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
  placeId: string;
  placeName: string;
  placeTimeZone: string;
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
  statuses?: Reservation["reservationStatus"][];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  timeBucket?: "past" | "upcoming";
  limit?: number;
  offset?: number;
  refetchIntervalMs?: number;
  enabled?: boolean;
}

interface UseOwnerReservationRealtimeStreamOptions {
  enabled?: boolean;
  reservationIds?: string[];
}

const MAX_PROCESSED_REALTIME_EVENTS = 200;

const normalizeReservationIds = (reservationIds?: string[]) =>
  Array.from(
    new Set(
      (reservationIds ?? [])
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    ),
  );

function formatDate(date: Date): string {
  return formatDateValue(date, "yyyy-MM-dd");
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

function formatReservationTime(
  isoString: string | null | undefined,
  timeZone: string,
): string {
  if (!isoString) return "--:--";

  try {
    return formatTimeInTimeZone(isoString, timeZone);
  } catch {
    return "--:--";
  }
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
  const placeTimeZone = record.placeTimeZone;
  const reservationDate =
    record.slotStartTime && placeTimeZone
      ? getZonedDayKey(record.slotStartTime, placeTimeZone)
      : record.createdAt
        ? getZonedDayKey(record.createdAt, placeTimeZone)
        : "";

  return {
    id: record.id,
    reservationGroupId: record.reservationGroupId ?? null,
    placeId: record.placeId,
    placeName: record.placeName,
    placeTimeZone,
    courtId: record.courtId,
    courtName: record.courtName,
    playerName: record.playerNameSnapshot ?? "Unknown",
    playerEmail: record.playerEmailSnapshot ?? "",
    playerPhone: record.playerPhoneSnapshot ?? "",
    date: reservationDate,
    startTime: formatReservationTime(record.slotStartTime, placeTimeZone),
    endTime: formatReservationTime(record.slotEndTime, placeTimeZone),
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

export type DashboardActivityType =
  | "booking"
  | "payment"
  | "blocked"
  | "confirmed";

export interface DashboardActivity {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  timestamp: string;
}

export type DashboardBookingStatus = "booked" | "pending";

export interface DashboardTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: DashboardBookingStatus;
  playerName: string;
  courtName: string;
}

interface DashboardData {
  todayBookingsCount: number;
  todaySchedule: DashboardTimeSlot[];
  recentActivity: DashboardActivity[];
}

const DASHBOARD_REFRESH_INTERVAL_MS = 15_000;

function mapReservationToActivityType(
  status: Reservation["reservationStatus"],
): DashboardActivityType {
  switch (status) {
    case "CONFIRMED":
      return "confirmed";
    case "PAYMENT_MARKED_BY_USER":
      return "payment";
    case "CREATED":
    case "AWAITING_PAYMENT":
      return "booking";
    case "CANCELLED":
    case "EXPIRED":
      return "blocked";
  }
}

function mapReservationToActivityTitle(
  status: Reservation["reservationStatus"],
): string {
  switch (status) {
    case "CONFIRMED":
      return "Booking confirmed";
    case "PAYMENT_MARKED_BY_USER":
      return "Payment marked";
    case "CREATED":
    case "AWAITING_PAYMENT":
      return "New booking request";
    case "CANCELLED":
      return "Booking cancelled";
    case "EXPIRED":
      return "Booking expired";
  }
}

function deriveDashboardData(
  rawRecords: OwnerReservationRecord[],
): DashboardData {
  const reservations = aggregateGroupedReservations(
    rawRecords.map(mapOwnerReservationRecord),
  );

  // Today's confirmed bookings count
  const todayBookingsCount = reservations.filter(
    (r) =>
      r.date === getZonedDayKey(new Date(), r.placeTimeZone) &&
      r.reservationStatus === "CONFIRMED",
  ).length;

  // Today's schedule: confirmed + pending, sorted by start time
  const pendingStatuses = new Set([
    "CREATED",
    "AWAITING_PAYMENT",
    "PAYMENT_MARKED_BY_USER",
  ]);
  const todaySchedule = reservations
    .filter(
      (r) =>
        r.date === getZonedDayKey(new Date(), r.placeTimeZone) &&
        (r.reservationStatus === "CONFIRMED" ||
          pendingStatuses.has(r.reservationStatus)),
    )
    .sort((a, b) => {
      const aTime = a.slotStartTime ? new Date(a.slotStartTime).getTime() : 0;
      const bTime = b.slotStartTime ? new Date(b.slotStartTime).getTime() : 0;
      return aTime - bTime;
    })
    .map(
      (r): DashboardTimeSlot => ({
        id: r.id,
        startTime: r.slotStartTime ?? r.createdAt,
        endTime: r.slotEndTime ?? r.createdAt,
        status: r.reservationStatus === "CONFIRMED" ? "booked" : "pending",
        playerName: r.playerName,
        courtName: r.courtName,
      }),
    );

  // Recent activity: last 5 reservations by createdAt
  const recentActivity = [...reservations]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .map(
      (r): DashboardActivity => ({
        id: r.id,
        type: mapReservationToActivityType(r.reservationStatus),
        title: mapReservationToActivityTitle(r.reservationStatus),
        description: `${r.courtName} · ${r.playerName}`,
        timestamp: r.createdAt,
      }),
    );

  return { todayBookingsCount, todaySchedule, recentActivity };
}

export function useQueryDashboardData(organizationId: string | null) {
  const queryInput = normalizeOwnerReservationScopeInput({
    organizationId: organizationId ?? "",
    limit: 100,
    offset: 0,
  });

  return useFeatureQuery(
    ["reservationOwner", "getForOrganization"],
    ownerApi.queryReservationOwnerGetForOrganization,
    queryInput,
    {
      enabled: !!organizationId,
      refetchInterval: DASHBOARD_REFRESH_INTERVAL_MS,
      select: (data: unknown) => {
        const records = (data as OwnerReservationRecord[]) ?? [];
        return deriveDashboardData(records);
      },
    },
  );
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
    statuses,
    search,
    reservationId,
    refetchIntervalMs,
    timeBucket,
    limit,
    offset,
    placeId,
    enabled = true,
  } = options;

  const queryInput = normalizeOwnerReservationScopeInput({
    organizationId: organizationId ?? "",
    reservationId: reservationId || undefined,
    placeId: placeId || undefined,
    courtId: courtId || undefined,
    status: status && status !== "all" ? mapStatusToBackend(status) : undefined,
    statuses: statuses?.length ? statuses : undefined,
    timeBucket,
    limit: limit ?? 100,
    offset: offset ?? 0,
  });

  return useFeatureQuery(
    ["reservationOwner", "getForOrganization"],
    ownerApi.queryReservationOwnerGetForOrganization,
    queryInput,
    {
      enabled: !!organizationId && enabled,
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

export function useQueryOwnerReservationInbox(
  organizationId: string | null,
  options: Omit<
    UseOwnerReservationsOptions,
    "status" | "statuses" | "timeBucket"
  > = {},
) {
  return useModOwnerReservations(organizationId, {
    ...options,
    statuses: ["CREATED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"],
  });
}

export function useQueryOwnerReservationSchedule(
  organizationId: string | null,
  options: Omit<
    UseOwnerReservationsOptions,
    "status" | "statuses" | "timeBucket"
  > = {},
) {
  return useModOwnerReservations(organizationId, {
    ...options,
    statuses: ["CONFIRMED"],
    timeBucket: "upcoming",
  });
}

export function useQueryOwnerReservationHistoryList(
  organizationId: string | null,
  options: Omit<UseOwnerReservationsOptions, "status" | "timeBucket"> & {
    statuses: Reservation["reservationStatus"][];
    timeBucket?: "past" | "upcoming";
  },
) {
  return useModOwnerReservations(organizationId, options);
}

export function useQueryOwnerReservationSummaries(
  organizationId: string | null,
  options: UseOwnerReservationsOptions = {},
) {
  return useModOwnerReservations(organizationId, options);
}

export function useQueryOwnerReservationEntity(
  organizationId: string | null,
  reservationId?: string,
) {
  const query = useQueryOwnerReservationSummaries(organizationId, {
    reservationId,
  });

  return {
    ...query,
    data: query.data?.[0] ?? null,
  };
}

export function useQueryOwnerReservationDashboardProjection(
  organizationId: string | null,
) {
  return useQueryDashboardData(organizationId);
}

export function useQueryOwnerReservationAlertsProjection(
  organizationId: string | null,
  options: {
    placeId?: string;
    courtId?: string;
  } = {},
) {
  return useModReservationAlerts(organizationId, options);
}

export function useModOwnerReservationRealtimeStream(
  options: UseOwnerReservationRealtimeStreamOptions = {},
) {
  const { enabled = true, reservationIds } = options;
  const { syncOwnerReservationChange } = useModReservationSync();
  const processedEventIdsRef = useRef<string[]>([]);

  const reservationIdsKey = useMemo(
    () => normalizeReservationIds(reservationIds).join(","),
    [reservationIds],
  );

  useEffect(() => {
    if (!enabled) return;
    const scopedReservationIds = reservationIdsKey
      ? reservationIdsKey.split(",")
      : [];

    const subscription = reservationRealtimeApi.subscribeOwner({
      // Unscoped owner subscriptions rely on DB-side RLS policies.
      reservationIds:
        scopedReservationIds.length > 0 ? scopedReservationIds : undefined,
      onEvent: (event) => {
        if (processedEventIdsRef.current.includes(event.eventId)) {
          return;
        }

        processedEventIdsRef.current.push(event.eventId);
        if (
          processedEventIdsRef.current.length > MAX_PROCESSED_REALTIME_EVENTS
        ) {
          processedEventIdsRef.current.splice(
            0,
            processedEventIdsRef.current.length - MAX_PROCESSED_REALTIME_EVENTS,
          );
        }

        void syncOwnerReservationChange({
          reservationId: event.reservationId,
          includeHistory: true,
        });
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, reservationIdsKey, syncOwnerReservationChange]);
}

type ReservationActionInput = {
  reservationId: string;
};

type ConfirmReservationActionInput = ReservationActionInput & {
  notes?: string;
};

type RejectReservationActionInput = ReservationActionInput & {
  reason: string;
};

export function useMutAcceptReservation() {
  const { syncOwnerReservationChange } = useModReservationSync();

  return useFeatureMutation(
    async (input: ReservationActionInput) =>
      ownerApi.mutReservationOwnerAccept({
        reservationId: input.reservationId,
      }),
    {
      onSuccess: async (_data, variables) => {
        const payload = variables as ReservationActionInput | undefined;
        await syncOwnerReservationChange({
          reservationId: payload?.reservationId,
        });
      },
    },
  );
}

export function useMutConfirmReservation() {
  const { syncOwnerReservationChange } = useModReservationSync();

  return useFeatureMutation(
    async (input: ConfirmReservationActionInput) =>
      ownerApi.mutReservationOwnerConfirmPayment({
        reservationId: input.reservationId,
        notes: input.notes,
      }),
    {
      onSuccess: async (_data, variables) => {
        const payload = variables as ConfirmReservationActionInput | undefined;
        await syncOwnerReservationChange({
          reservationId: payload?.reservationId,
        });
      },
    },
  );
}

export function useMutRejectReservation() {
  const { syncOwnerReservationChange } = useModReservationSync();

  return useFeatureMutation(
    async (input: RejectReservationActionInput) =>
      ownerApi.mutReservationOwnerReject({
        reservationId: input.reservationId,
        reason: input.reason,
      }),
    {
      onSuccess: async (_data, variables) => {
        const payload = variables as RejectReservationActionInput | undefined;
        await syncOwnerReservationChange({
          reservationId: payload?.reservationId,
        });
      },
    },
  );
}

type CancelReservationActionInput = ReservationActionInput & {
  reason: string;
};

export function useMutCancelReservation() {
  const utils = trpc.useUtils();

  return useFeatureMutation(
    async (input: CancelReservationActionInput) =>
      ownerApi.mutReservationOwnerCancel({
        reservationId: input.reservationId,
        reason: input.reason,
      }),
    {
      onSuccess: async () => {
        await Promise.all([
          utils.reservationOwner.getForOrganization.invalidate(),
          utils.reservationOwner.getActiveForCourtRange.invalidate(),
          utils.reservationOwner.getPendingCount.invalidate(),
        ]);
      },
    },
  );
}

export function useQueryReservationLinkedDetail(reservationId?: string) {
  return useFeatureQuery(
    ["reservationOwner", "getLinkedDetail"],
    ownerApi.queryReservationOwnerGetLinkedDetail,
    {
      reservationId: reservationId ?? "",
    },
    {
      enabled: !!reservationId,
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
  const { syncOwnerReservationChange } = useModReservationSync();
  return useFeatureMutation(ownerApi.mutReservationOwnerConfirmPaidOffline, {
    ...(options ?? {}),
    onSuccess: async (_data, variables, context) => {
      const payload = variables as { reservationId?: string } | undefined;
      await syncOwnerReservationChange({
        reservationId: payload?.reservationId,
      });
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
