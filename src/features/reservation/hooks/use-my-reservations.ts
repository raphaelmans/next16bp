"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import type { ReservationTab } from "./use-reservations-tabs";

interface UseMyReservationsOptions {
  tab?: ReservationTab;
  page?: number;
  limit?: number;
}

// Map tab to status filter
const TAB_STATUS_MAP: Record<
  ReservationTab,
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_MARKED_BY_USER"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED"
  | undefined
> = {
  upcoming: "AWAITING_PAYMENT", // Show pending payments first
  past: "CONFIRMED",
  cancelled: "CANCELLED",
};

/**
 * Hook to fetch current user's reservations
 * Connected to reservation.getMy tRPC endpoint
 *
 * Note: The backend returns basic reservation data without court details.
 * For a richer UI, the backend service should be enhanced to join with
 * time_slot, court, and court_photo tables.
 */
export function useMyReservations(options: UseMyReservationsOptions = {}) {
  const { tab = "upcoming", page = 1, limit = 10 } = options;
  const trpc = useTRPC();
  const offset = (page - 1) * limit;

  const status = TAB_STATUS_MAP[tab];

  const query = useQuery(
    trpc.reservation.getMy.queryOptions({
      status,
      limit,
      offset,
    }),
  );

  // Transform the array data to paginated format with UI-friendly structure
  // Note: Backend returns plain reservation records, we enrich with placeholder structure
  const transformedData = query.data
    ? {
        items: query.data.map((item) => ({
          id: item.id,
          status: item.status,
          timeSlotId: item.timeSlotId,
          createdAt: item.createdAt,
          expiresAt: item.expiresAt ?? undefined,
          // Player snapshot data
          playerName: item.playerNameSnapshot,
          playerPhone: item.playerPhoneSnapshot,
          // Placeholder court/slot info until backend is enhanced
          court: {
            id: "",
            name: "Loading...",
            address: "",
            coverImageUrl: undefined,
          },
          timeSlot: {
            id: item.timeSlotId,
            startTime: item.createdAt, // Placeholder
            endTime: item.createdAt, // Placeholder
            priceCents: 0,
            currency: "PHP",
          },
        })),
        total: query.data.length,
        page,
        limit,
        hasMore: query.data.length === limit, // Approximation
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
  const trpc = useTRPC();

  // Fetch counts for each status category
  const upcomingQuery = useQuery(
    trpc.reservation.getMy.queryOptions({
      status: "AWAITING_PAYMENT",
      limit: 100,
      offset: 0,
    }),
  );

  const pastQuery = useQuery(
    trpc.reservation.getMy.queryOptions({
      status: "CONFIRMED",
      limit: 100,
      offset: 0,
    }),
  );

  const cancelledQuery = useQuery(
    trpc.reservation.getMy.queryOptions({
      status: "CANCELLED",
      limit: 100,
      offset: 0,
    }),
  );

  return {
    data: {
      upcoming: upcomingQuery.data?.length ?? 0,
      past: pastQuery.data?.length ?? 0,
      cancelled: cancelledQuery.data?.length ?? 0,
    },
    isLoading:
      upcomingQuery.isLoading ||
      pastQuery.isLoading ||
      cancelledQuery.isLoading,
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
  timeSlotId: string;
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
