"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { trpc } from "@/trpc/client";

// ============================================================================
// From use-cancel-reservation.ts
// ============================================================================

/**
 * Hook to cancel a reservation
 * Connected to reservation.cancel tRPC endpoint
 */
export function useCancelReservation() {
  const router = useRouter();
  const utils = trpc.useUtils();

  return trpc.reservation.cancel.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("Reservation cancelled successfully");

      await Promise.all([
        utils.reservation.getById.invalidate({
          reservationId: variables.reservationId,
        }),
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        utils.reservationChat.getSession.invalidate({
          reservationId: variables.reservationId,
        }),
      ]);

      router.push(appRoutes.reservations.base);
    },
    onError: (error) => {
      toast.error("Failed to cancel reservation", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}

// ============================================================================
// From use-create-reservation-for-any-court.ts
// ============================================================================

export function useCreateReservationForAnyCourt() {
  const utils = trpc.useUtils();

  return trpc.reservation.createForAnyCourt.useMutation({
    onSuccess: async (data) => {
      const message =
        data.status === "CREATED"
          ? "Reservation request sent!"
          : data.status === "AWAITING_PAYMENT"
            ? "Reservation accepted! Please complete payment."
            : "Reservation confirmed!";
      toast.success(message);
      await Promise.all([
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        utils.reservationChat.getSession.invalidate({ reservationId: data.id }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create reservation");
    },
  });
}

// ============================================================================
// From use-create-reservation-for-court.ts
// ============================================================================

export function useCreateReservationForCourt() {
  const utils = trpc.useUtils();

  return trpc.reservation.createForCourt.useMutation({
    onSuccess: async (data) => {
      const message =
        data.status === "CREATED"
          ? "Reservation request sent!"
          : data.status === "AWAITING_PAYMENT"
            ? "Reservation accepted! Please complete payment."
            : "Reservation confirmed!";
      toast.success(message);
      await Promise.all([
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        utils.reservationChat.getSession.invalidate({ reservationId: data.id }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create reservation");
    },
  });
}

// ============================================================================
// From use-mark-payment.ts
// ============================================================================

/**
 * Hook to mark payment as completed for a reservation
 * Connected to reservation.markPayment tRPC endpoint
 */
export function useMarkPayment() {
  const utils = trpc.useUtils();

  return trpc.reservation.markPayment.useMutation({
    onSuccess: async (data, variables) => {
      const isConfirmed = data.status === "CONFIRMED";
      toast.success(
        isConfirmed
          ? "Reservation confirmed!"
          : "Payment submitted successfully!",
        {
          description: isConfirmed
            ? "Your reservation is confirmed."
            : "The court owner will verify your payment shortly.",
        },
      );

      await Promise.all([
        utils.reservation.getById.invalidate({
          reservationId: variables.reservationId,
        }),
        utils.reservation.getDetail.invalidate({
          reservationId: variables.reservationId,
        }),
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        utils.reservationChat.getSession.invalidate({
          reservationId: variables.reservationId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit payment");
    },
  });
}

// ============================================================================
// From use-my-reservations.ts
// ============================================================================

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

// ============================================================================
// From use-profile.ts
// ============================================================================

export interface Profile {
  id: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

/**
 * Hook to fetch current user's profile
 */
export function useProfile() {
  return trpc.profile.me.useQuery();
}

/**
 * Hook to update current user's profile
 */
export function useUpdateProfile() {
  const utils = trpc.useUtils();

  return trpc.profile.update.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated successfully");
      await utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

/**
 * Hook to upload user avatar
 */
export function useUploadAvatar() {
  const utils = trpc.useUtils();

  return trpc.profile.uploadAvatar.useMutation({
    onSuccess: async () => {
      toast.success("Avatar uploaded successfully");
      await utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload avatar");
    },
  });
}

// ============================================================================
// From use-reservation.ts
// ============================================================================

/**
 * Hook to fetch a single reservation by ID
 * Connected to reservation.getById tRPC endpoint
 */
export function useReservation(id: string) {
  return trpc.reservation.getById.useQuery(
    { reservationId: id },
    { enabled: !!id },
  );
}

// ============================================================================
// From use-reservations-tabs.ts
// ============================================================================

export const reservationTabs = ["upcoming", "past", "cancelled"] as const;
export type ReservationTab = (typeof reservationTabs)[number];

export function useReservationsTabs() {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(reservationTabs)
      .withDefault("upcoming")
      .withOptions({ history: "push" }),
  );

  return { tab, setTab };
}

// ============================================================================
// From use-upload-payment-proof.ts
// ============================================================================

/**
 * Hook to upload payment proof for a reservation
 * Connected to paymentProof.upload tRPC endpoint
 */
export function useUploadPaymentProof() {
  const utils = trpc.useUtils();

  return trpc.paymentProof.upload.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("Payment proof uploaded successfully!", {
        description: "The court owner will review your payment shortly.",
      });

      const reservationId =
        variables instanceof FormData
          ? variables.get("reservationId")
          : undefined;

      await Promise.all([
        typeof reservationId === "string" && reservationId.length > 0
          ? utils.reservation.getDetail.invalidate({ reservationId })
          : Promise.resolve(),
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload payment proof");
    },
  });
}
