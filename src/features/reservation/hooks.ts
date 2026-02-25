"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { appRoutes } from "@/common/app-routes";
import {
  createFeatureQueryOptions,
  useFeatureMutation,
  useFeatureQueries,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { toast } from "@/common/toast";
import { buildTrpcQueryKey } from "@/common/trpc-client-call";
import { trpc } from "@/trpc/client";
import { getReservationApi } from "./api.runtime";

const reservationApi = getReservationApi();

// ============================================================================
// From use-cancel-reservation.ts
// ============================================================================

/**
 * Hook to cancel a reservation
 * Connected to reservation.cancel tRPC endpoint
 */
export function useMutCancelReservation() {
  const router = useRouter();
  const utils = trpc.useUtils();

  return useFeatureMutation(reservationApi.mutReservationCancel, {
    onSuccess: async (_data, variables) => {
      const reservationId = (variables as { reservationId: string })
        .reservationId;
      toast.success("Reservation cancelled successfully");

      await Promise.all([
        utils.reservation.getById.invalidate({
          reservationId,
        }),
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        utils.reservationChat.getSession.invalidate({
          reservationId,
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

export function useMutCreateReservationForAnyCourt() {
  const utils = trpc.useUtils();

  return useFeatureMutation(reservationApi.mutReservationCreateForAnyCourt, {
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

export function useMutCreateReservationGroup() {
  const utils = trpc.useUtils();

  return useFeatureMutation(reservationApi.mutReservationCreateGroup, {
    onSuccess: async () => {
      toast.success("Multi-court reservation request sent!");
      await Promise.all([
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create multi-court reservation");
    },
  });
}

// ============================================================================
// From use-create-reservation-for-court.ts
// ============================================================================

export function useMutCreateReservationForCourt() {
  const utils = trpc.useUtils();

  return useFeatureMutation(reservationApi.mutReservationCreateForCourt, {
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
export function useMutMarkPayment() {
  const utils = trpc.useUtils();

  return useFeatureMutation(reservationApi.mutReservationMarkPayment, {
    onSuccess: async (data, variables) => {
      const reservationId = (variables as { reservationId: string })
        .reservationId;
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
          reservationId,
        }),
        utils.reservation.getDetail.invalidate({
          reservationId,
        }),
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        utils.reservationChat.getSession.invalidate({
          reservationId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit payment");
    },
  });
}

export function useMutMarkPaymentGroup() {
  const utils = trpc.useUtils();

  return useFeatureMutation(reservationApi.mutReservationMarkPaymentGroup, {
    onSuccess: async (data, variables) => {
      const reservationGroupId = (variables as { reservationGroupId: string })
        .reservationGroupId;
      toast.success("Payment submitted successfully!", {
        description: "The court owner will verify your payment shortly.",
      });

      const reservationIds = (
        data as { reservations: { id: string }[] }
      ).reservations.map((r) => r.id);

      await Promise.all([
        utils.reservation.getGroupDetail.invalidate({
          reservationGroupId,
        }),
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
        utils.reservationChat.getThreadMetas.invalidate(),
        utils.reservationChat.getGroupSession.invalidate({
          reservationGroupId,
        }),
        ...reservationIds.flatMap((reservationId) => [
          utils.reservation.getDetail.invalidate({ reservationId }),
          utils.reservation.getById.invalidate({ reservationId }),
        ]),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit group payment");
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
  reservationGroupId?: string | null;
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
  openPlayId: string | null;
  isGroupPrimary?: boolean;
  groupItemCount?: number;
};

interface UseMyReservationsOptions {
  tab?: ReservationListView;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

const CANCELLED_STATUSES = new Set<ReservationStatus>(["CANCELLED", "EXPIRED"]);

const PENDING_STATUSES = new Set<ReservationStatus>([
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
]);

const parseIsoDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getSlotStartTime = (item: ReservationListItemData) =>
  parseIsoDate(item.slotStartTime) ?? parseIsoDate(item.createdAt);

const getSlotEndTime = (item: ReservationListItemData) =>
  parseIsoDate(item.slotEndTime) ?? getSlotStartTime(item);

const isCancelledReservation = (item: ReservationListItemData) =>
  CANCELLED_STATUSES.has(item.status);

const isPendingReservation = (item: ReservationListItemData) =>
  !isCancelledReservation(item) && PENDING_STATUSES.has(item.status);

const isUpcomingReservation = (item: ReservationListItemData, now: Date) => {
  if (item.status !== "CONFIRMED") return false;
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

function deriveGroupStatus(
  items: ReservationListItemData[],
): ReservationStatus {
  const statuses = new Set(items.map((item) => item.status));
  if (statuses.has("PAYMENT_MARKED_BY_USER")) return "PAYMENT_MARKED_BY_USER";
  if (statuses.has("CREATED")) return "CREATED";
  if (statuses.has("AWAITING_PAYMENT")) return "AWAITING_PAYMENT";
  if (statuses.has("CONFIRMED")) return "CONFIRMED";
  if (statuses.has("EXPIRED")) return "EXPIRED";
  return "CANCELLED";
}

function aggregateGroupedItems(
  items: ReservationListItemData[],
): ReservationListItemData[] {
  const grouped = new Map<string, ReservationListItemData[]>();
  const singles: ReservationListItemData[] = [];

  for (const item of items) {
    if (!item.reservationGroupId) {
      singles.push(item);
      continue;
    }
    const existing = grouped.get(item.reservationGroupId) ?? [];
    existing.push(item);
    grouped.set(item.reservationGroupId, existing);
  }

  const groupRows: ReservationListItemData[] = [];

  for (const [reservationGroupId, groupItems] of grouped.entries()) {
    const sortedItems = [...groupItems].sort((a, b) => {
      const aStart = a.slotStartTime ? new Date(a.slotStartTime).getTime() : 0;
      const bStart = b.slotStartTime ? new Date(b.slotStartTime).getTime() : 0;
      return aStart - bStart;
    });
    const primary = sortedItems[0];
    const endItem = sortedItems[sortedItems.length - 1] ?? primary;
    const totalAmountCents = sortedItems.reduce(
      (sum, item) => sum + (item.amountCents ?? 0),
      0,
    );
    const expiresAtCandidates = sortedItems
      .map((item) => item.expiresAt)
      .filter((value): value is string => Boolean(value))
      .sort();

    const placeName = primary.courtName.split(" - ")[0];

    groupRows.push({
      ...primary,
      reservationGroupId,
      isGroupPrimary: true,
      groupItemCount: sortedItems.length,
      courtName:
        sortedItems.length > 1
          ? `${placeName} - ${sortedItems.length} courts`
          : primary.courtName,
      status: deriveGroupStatus(sortedItems),
      amountCents: totalAmountCents,
      slotStartTime: primary.slotStartTime,
      slotEndTime: endItem.slotEndTime,
      expiresAt: expiresAtCandidates[0] ?? null,
    });
  }

  return [...singles, ...groupRows];
}

const getStatusFilter = (tab: ReservationListView) => {
  if (tab === "upcoming") return "CONFIRMED";
  if (tab === "past") return "CONFIRMED";
  return undefined;
};

/**
 * Hook to fetch current user's reservations
 * Connected to reservation.getMyWithDetails tRPC endpoint
 */
export function useModMyReservations(options: UseMyReservationsOptions = {}) {
  const { tab = "upcoming", page = 1, limit = 100, enabled = true } = options;
  const offset = (page - 1) * limit;
  const status = getStatusFilter(tab);

  const query = useFeatureQuery(
    ["reservation", "getMyWithDetails"],
    reservationApi.queryReservationGetMyWithDetails,
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
        if (tab === "pending") {
          return isPendingReservation(item);
        }
        if (tab === "past") {
          return isPastReservation(item, now);
        }
        return isCancelledReservation(item);
      })
    : null;

  const aggregatedData = filteredData
    ? aggregateGroupedItems(filteredData)
    : null;

  const sortedData = aggregatedData
    ? [...aggregatedData].sort(
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
            reservationGroupId: item.reservationGroupId ?? null,
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
            openPlayId: item.openPlayId,
            isGroupPrimary: item.isGroupPrimary,
            groupItemCount: item.groupItemCount,
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
export function useQueryReservationCounts() {
  const [allQuery, confirmedQuery, cancelledQuery, expiredQuery] =
    useFeatureQueries([
      createFeatureQueryOptions(
        ["reservation", "getMyWithDetails"],
        reservationApi.queryReservationGetMyWithDetails,
        {
          limit: 100,
          offset: 0,
        },
      ),
      createFeatureQueryOptions(
        ["reservation", "getMyWithDetails"],
        reservationApi.queryReservationGetMyWithDetails,
        {
          status: "CONFIRMED",
          limit: 100,
          offset: 0,
        },
      ),
      createFeatureQueryOptions(
        ["reservation", "getMyWithDetails"],
        reservationApi.queryReservationGetMyWithDetails,
        {
          status: "CANCELLED",
          limit: 100,
          offset: 0,
        },
      ),
      createFeatureQueryOptions(
        ["reservation", "getMyWithDetails"],
        reservationApi.queryReservationGetMyWithDetails,
        {
          status: "EXPIRED",
          limit: 100,
          offset: 0,
        },
      ),
    ] as const);

  const now = new Date();

  const allAggregated = aggregateGroupedItems(allQuery.data ?? []);
  const confirmedAggregated = aggregateGroupedItems(confirmedQuery.data ?? []);
  const cancelledAggregated = aggregateGroupedItems(cancelledQuery.data ?? []);
  const expiredAggregated = aggregateGroupedItems(expiredQuery.data ?? []);

  const pendingCount = allAggregated.filter((item) =>
    isPendingReservation(item),
  ).length;
  const upcomingCount = confirmedAggregated.filter((item) =>
    isUpcomingReservation(item, now),
  ).length;
  const pastCount = confirmedAggregated.filter((item) =>
    isPastReservation(item, now),
  ).length;
  const cancelledCount = cancelledAggregated.length + expiredAggregated.length;

  return {
    data: {
      upcoming: upcomingCount,
      pending: pendingCount,
      past: pastCount,
      cancelled: cancelledCount,
    },
    isLoading:
      allQuery.isLoading ||
      confirmedQuery.isLoading ||
      cancelledQuery.isLoading ||
      expiredQuery.isLoading,
  };
}

// Type definitions for reservation list items with court and slot info
export interface ReservationListItem {
  id: string;
  reservationGroupId?: string | null;
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
  openPlayId?: string | null;
  isGroupPrimary?: boolean;
  groupItemCount?: number;
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
export function useQueryProfile() {
  return useFeatureQuery(["profile", "me"], reservationApi.queryProfileMe);
}

/**
 * Hook to update current user's profile
 */
export function useMutUpdateProfile() {
  const queryClient = useQueryClient();

  return useFeatureMutation(reservationApi.mutProfileUpdate, {
    onSuccess: async () => {
      toast.success("Profile updated successfully");
      await queryClient.invalidateQueries({
        queryKey: buildTrpcQueryKey(["profile", "me"]),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

/**
 * Hook to upload user avatar
 */
export function useMutUploadAvatar() {
  const queryClient = useQueryClient();

  return useFeatureMutation(reservationApi.mutProfileUploadAvatar, {
    onSuccess: async () => {
      toast.success("Avatar uploaded successfully");
      await queryClient.invalidateQueries({
        queryKey: buildTrpcQueryKey(["profile", "me"]),
      });
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
export function useQueryReservation(id: string) {
  return useFeatureQuery(
    ["reservation", "getById"],
    reservationApi.queryReservationGetById,
    { reservationId: id },
    { enabled: !!id },
  );
}

export function useQueryReservationDetail(
  reservationId: string,
  refetchInterval?: number,
) {
  return useFeatureQuery(
    ["reservation", "getDetail"],
    reservationApi.queryReservationGetDetail,
    { reservationId },
    {
      enabled: Boolean(reservationId),
      refetchInterval,
    },
  );
}

export function useQueryReservationGroupDetail(
  reservationGroupId: string,
  refetchInterval?: number,
) {
  return useFeatureQuery(
    ["reservation", "getGroupDetail"],
    reservationApi.queryReservationGetGroupDetail,
    { reservationGroupId },
    {
      enabled: Boolean(reservationGroupId),
      refetchInterval,
    },
  );
}

export function useQueryReservationPaymentInfo(
  reservationId: string,
  enabled: boolean,
) {
  return useFeatureQuery(
    ["reservation", "getPaymentInfo"],
    reservationApi.queryReservationGetPaymentInfo,
    { reservationId },
    { enabled },
  );
}

export function useMutAddPaymentProof() {
  const utils = trpc.useUtils();

  return useFeatureMutation(reservationApi.mutPaymentProofAdd, {
    onSuccess: async (_data, variables) => {
      const reservationId = (variables as { reservationId: string })
        .reservationId;

      await Promise.all([
        utils.reservation.getDetail.invalidate({ reservationId }),
        utils.reservation.getMy.invalidate(),
        utils.reservation.getMyWithDetails.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit payment proof");
    },
  });
}

// ============================================================================
// From use-reservations-tabs.ts
// ============================================================================

export const reservationTabs = ["upcoming", "past", "cancelled"] as const;
export type ReservationTab = (typeof reservationTabs)[number];
export type ReservationListView = ReservationTab | "pending";

export function useModReservationsTabs() {
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
export function useMutUploadPaymentProof() {
  const utils = trpc.useUtils();

  return useFeatureMutation(reservationApi.mutPaymentProofUpload, {
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

export function useModReservationInvalidation() {
  const cache = trpc.useUtils();

  const invalidateReservationDetail = (
    ...args: Parameters<typeof cache.reservation.getDetail.invalidate>
  ) => cache.reservation.getDetail.invalidate(...args);

  return {
    invalidateReservationDetail,
  };
}

export function useModReservationPostPaymentWarmup() {
  const cache = trpc.useUtils();

  return {
    warmupAfterPayment: async (reservationId: string) =>
      Promise.all([
        cache.reservation.getDetail.fetch({ reservationId }),
        cache.reservation.getMyWithDetails.fetch({ limit: 10, offset: 0 }),
      ]),
  };
}
