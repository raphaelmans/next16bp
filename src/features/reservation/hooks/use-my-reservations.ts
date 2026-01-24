"use client";

import { trpc } from "@/trpc/client";
import type { ReservationTab } from "./use-reservations-tabs";

type ReservationStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";

type ReservationListItemData = {
  id: string;
  status: ReservationStatus;
  playerNameSnapshot: string | null;
  playerPhoneSnapshot: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  courtId: string;
  courtName: string;
  placeAddress: string;
  coverImageUrl: string | null;
  slotStartTime: string;
  slotEndTime: string;
  amountCents: number | null;
  currency: string | null;
};

interface UseMyReservationsOptions {
  tab?: ReservationTab;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

const CANCELLED_STATUSES = new Set<ReservationStatus>(["CANCELLED", "EXPIRED"]);

const parseIsoDate = (value: string | null | undefined) =>
  value ? new Date(value) : null;

const getSlotStartTime = (item: ReservationListItemData) =>
  parseIsoDate(item.slotStartTime) ?? parseIsoDate(item.createdAt);

const getSlotEndTime = (item: ReservationListItemData) =>
  parseIsoDate(item.slotEndTime) ?? getSlotStartTime(item);

const isCancelledReservation = (item: ReservationListItemData) =>
  CANCELLED_STATUSES.has(item.status);

const isUpcomingReservation = (item: ReservationListItemData, now: Date) => {
  if (isCancelledReservation(item)) return false;
  const endTime = getSlotEndTime(item);
  if (!endTime) return true;
  return endTime >= now;
};

const isPastReservation = (item: ReservationListItemData, now: Date) => {
  if (item.status !== "CONFIRMED") return false;
  const endTime = getSlotEndTime(item);
  if (!endTime) return false;
  return endTime < now;
};

const sortByStartTimeAsc = (
  a: ReservationListItemData,
  b: ReservationListItemData,
) => {
  const aTime = getSlotStartTime(a)?.getTime() ?? 0;
  const bTime = getSlotStartTime(b)?.getTime() ?? 0;
  return aTime - bTime;
};

const sortByStartTimeDesc = (
  a: ReservationListItemData,
  b: ReservationListItemData,
) => {
  const aTime = getSlotStartTime(a)?.getTime() ?? 0;
  const bTime = getSlotStartTime(b)?.getTime() ?? 0;
  return bTime - aTime;
};

const getStatusFilter = (tab: ReservationTab) =>
  tab === "past" ? "CONFIRMED" : undefined;

/**
 * Hook to fetch current user's reservations
 * Connected to reservation.getMyWithDetails tRPC endpoint
 */
export function useMyReservations(options: UseMyReservationsOptions = {}) {
  const { tab = "upcoming", page = 1, limit = 10, enabled = true } = options;
  const offset = (page - 1) * limit;
  const status = getStatusFilter(tab);

  const query = trpc.reservation.getMyWithDetails.useQuery(
    {
      status,
      limit,
      offset,
    },
    { enabled },
  );

  const reservations = query.data ?? null;
  const now = new Date();

  const filteredData = reservations
    ? reservations.filter((item) => {
        if (tab === "upcoming") {
          return isUpcomingReservation(item, now);
        }
        if (tab === "past") {
          return isPastReservation(item, now);
        }
        return isCancelledReservation(item);
      })
    : null;

  const sortedData = filteredData
    ? [...filteredData].sort(
        tab === "upcoming" ? sortByStartTimeAsc : sortByStartTimeDesc,
      )
    : null;

  const transformedData = sortedData
    ? {
        items: sortedData.map((item) => {
          const startTime =
            item.slotStartTime || item.createdAt || new Date().toISOString();
          const endTime = item.slotEndTime || startTime;
          const priceCents = item.amountCents ?? 0;
          const currency = item.currency ?? "PHP";

          return {
            id: item.id,
            status: item.status,
            createdAt: item.createdAt ?? startTime,
            expiresAt: item.expiresAt ?? undefined,
            playerName: item.playerNameSnapshot,
            playerPhone: item.playerPhoneSnapshot,
            court: {
              id: item.courtId,
              name: item.courtName,
              address: item.placeAddress,
              coverImageUrl: item.coverImageUrl ?? undefined,
            },
            timeSlot: {
              id: item.id,
              startTime,
              endTime,
              priceCents,
              currency,
            },
          };
        }),
        total: sortedData.length,
        page,
        limit,
        hasMore: sortedData.length === limit,
      }
    : undefined;

  return {
    ...query,
    data: transformedData,
  };
}

/**
 * Hook to get reservation counts by tab
 * This fetches counts for each tab to display badges
 */
export function useReservationCounts() {
  const [allQuery, pastQuery, cancelledQuery, expiredQuery] = trpc.useQueries(
    (t) => [
      t.reservation.getMyWithDetails({
        limit: 100,
        offset: 0,
      }),
      t.reservation.getMyWithDetails({
        status: "CONFIRMED",
        limit: 100,
        offset: 0,
      }),
      t.reservation.getMyWithDetails({
        status: "CANCELLED",
        limit: 100,
        offset: 0,
      }),
      t.reservation.getMyWithDetails({
        status: "EXPIRED",
        limit: 100,
        offset: 0,
      }),
    ],
  );

  const now = new Date();
  const upcomingCount = (allQuery.data ?? []).filter((item) =>
    isUpcomingReservation(item, now),
  ).length;
  const pastCount = (pastQuery.data ?? []).filter((item) =>
    isPastReservation(item, now),
  ).length;
  const cancelledCount =
    (cancelledQuery.data?.length ?? 0) + (expiredQuery.data?.length ?? 0);

  return {
    data: {
      upcoming: upcomingCount,
      past: pastCount,
      cancelled: cancelledCount,
    },
    isLoading:
      allQuery.isLoading ||
      pastQuery.isLoading ||
      cancelledQuery.isLoading ||
      expiredQuery.isLoading,
  };
}

// Type definitions for reservation list items with court and slot info
export interface ReservationListItem {
  id: string;
  status:
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED";
  createdAt: string;
  expiresAt?: string;
  playerName?: string | null;
  playerPhone?: string | null;
  court: {
    id: string;
    name: string;
    address: string;
    coverImageUrl?: string;
  };
  timeSlot: {
    id: string;
    startTime: string;
    endTime: string;
    priceCents: number;
    currency: string;
  };
}
