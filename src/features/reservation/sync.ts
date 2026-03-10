"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { reservationQueryKeys } from "@/common/query-keys";
import { buildTrpcQueryKey } from "@/common/trpc-query-key";

type ReservationSyncInput = {
  reservationId?: string;
  reservationIds?: string[];
  includeLinkedDetail?: boolean;
  includeHistory?: boolean;
  includeNotifications?: boolean;
};

type ReservationNotificationPortal = "organization" | "player" | "admin";

const normalizeReservationIds = (input: ReservationSyncInput) =>
  Array.from(
    new Set(
      [input.reservationId, ...(input.reservationIds ?? [])]
        .map((id) => id?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  );

export const isReservationNotificationEventType = (eventType: string) =>
  eventType.startsWith("reservation.") ||
  eventType.startsWith("reservation_group.");

export const extractReservationIdFromNotificationHref = (
  href?: string | null,
) => {
  if (!href) return undefined;

  const reservationMatch = href.match(/^\/reservations\/([^/]+)/);
  if (reservationMatch?.[1]) {
    return reservationMatch[1];
  }

  const ownerReservationMatch = href.match(
    /^\/organization\/reservations\/([^/]+)/,
  );
  if (ownerReservationMatch?.[1] && ownerReservationMatch[1] !== "group") {
    return ownerReservationMatch[1];
  }

  return undefined;
};

export function useModReservationSync() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    (path: readonly string[], input?: unknown) =>
      queryClient.invalidateQueries({
        queryKey: buildTrpcQueryKey(path, input),
      }),
    [queryClient],
  );

  const syncReservationNotifications = useCallback(
    async () =>
      Promise.all([
        invalidate(["userNotification", "unreadCount"]),
        invalidate(["userNotification", "listMy"]),
      ]),
    [invalidate],
  );

  const syncReservationChat = useCallback(
    async (reservationIds: string[]) =>
      Promise.all([
        invalidate(["reservationChat", "getThreadMetas"]),
        ...reservationIds.map((reservationId) =>
          invalidate(["reservationChat", "getSession"], { reservationId }),
        ),
      ]),
    [invalidate],
  );

  const syncReservationChatInbox = useCallback(
    async (
      reservationIds: string[],
      options?: {
        visibleReservationIds?: string[];
        visibleReservationGroupIds?: string[];
        includeArchivedThreadIds?: boolean;
      },
    ) =>
      Promise.all([
        syncReservationChat(reservationIds),
        invalidate(["chatMessage", "listThreadSummaries"], {
          threadIdPrefix: "res-",
          limit: 30,
        }),
        invalidate(["chatMessage", "listThreadSummaries"], {
          threadIdPrefix: "grp-",
          limit: 30,
        }),
        invalidate(["chatMessage", "getUnreadCounts"]),
        invalidate(["reservationChat", "getThreadMetas"], {
          reservationIds: options?.visibleReservationIds,
          reservationGroupIds: options?.visibleReservationGroupIds,
        }),
        options?.includeArchivedThreadIds
          ? invalidate(["chatInbox", "listArchivedThreadIds"], {
              threadKind: "reservation",
            })
          : Promise.resolve(),
      ]),
    [syncReservationChat, invalidate],
  );

  const syncPlayerReservationOverview = useCallback(
    async (includeNotifications = true) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: buildTrpcQueryKey(["reservation", "getMy"]),
        }),
        queryClient.invalidateQueries({
          queryKey: buildTrpcQueryKey(["reservation", "getMyWithDetails"]),
        }),
        includeNotifications
          ? syncReservationNotifications()
          : Promise.resolve(),
      ]),
    [queryClient, syncReservationNotifications],
  );

  const syncPlayerReservationChange = useCallback(
    async (input: ReservationSyncInput) => {
      const reservationIds = normalizeReservationIds(input);

      await Promise.all([
        syncPlayerReservationOverview(input.includeNotifications ?? true),
        syncReservationChat(reservationIds),
        ...reservationIds.map((reservationId) =>
          queryClient.invalidateQueries({
            queryKey: reservationQueryKeys.playerDetail(reservationId),
          }),
        ),
        ...reservationIds.map((reservationId) =>
          queryClient.invalidateQueries({
            queryKey: reservationQueryKeys.playerById(reservationId),
          }),
        ),
        ...((input.includeLinkedDetail ?? true)
          ? reservationIds.map((reservationId) =>
              queryClient.invalidateQueries({
                queryKey:
                  reservationQueryKeys.playerLinkedDetail(reservationId),
              }),
            )
          : []),
      ]);
    },
    [queryClient, syncPlayerReservationOverview, syncReservationChat],
  );

  const syncOwnerReservationOverview = useCallback(
    async (includeNotifications = true) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: buildTrpcQueryKey([
            "reservationOwner",
            "getForOrganization",
          ]),
        }),
        queryClient.invalidateQueries({
          queryKey: buildTrpcQueryKey(["reservationOwner", "getPendingCount"]),
        }),
        queryClient.invalidateQueries({
          queryKey: buildTrpcQueryKey(["reservationOwner", "getLinkedDetail"]),
        }),
        includeNotifications
          ? syncReservationNotifications()
          : Promise.resolve(),
      ]),
    [queryClient, syncReservationNotifications],
  );

  const syncOwnerReservationChange = useCallback(
    async (input: ReservationSyncInput) => {
      const reservationIds = normalizeReservationIds(input);

      await Promise.all([
        syncOwnerReservationOverview(input.includeNotifications ?? true),
        syncReservationChat(reservationIds),
        ...((input.includeHistory ?? false)
          ? reservationIds.map((reservationId) =>
              queryClient.invalidateQueries({
                queryKey: reservationQueryKeys.ownerHistory(reservationId),
              }),
            )
          : []),
      ]);
    },
    [queryClient, syncOwnerReservationOverview, syncReservationChat],
  );

  const syncOwnerAvailabilityRange = useCallback(
    async (input?: { courtId: string; startTime: string; endTime: string }) => {
      if (!input) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: reservationQueryKeys.ownerActiveForCourtRange(input),
      });
    },
    [queryClient],
  );

  const syncReservationNotificationEvent = useCallback(
    async (input: {
      portal: ReservationNotificationPortal;
      eventType: string;
      href?: string | null;
    }) => {
      if (!isReservationNotificationEventType(input.eventType)) {
        return;
      }

      const reservationId = extractReservationIdFromNotificationHref(
        input.href,
      );

      if (input.portal === "organization") {
        if (reservationId) {
          await syncOwnerReservationChange({
            reservationId,
            includeHistory: true,
          });
          return;
        }

        await syncOwnerReservationOverview();
        return;
      }

      if (input.portal === "player") {
        if (reservationId) {
          await syncPlayerReservationChange({
            reservationId,
            includeLinkedDetail: true,
          });
          return;
        }

        await syncPlayerReservationOverview();
      }
    },
    [
      syncOwnerReservationChange,
      syncOwnerReservationOverview,
      syncPlayerReservationChange,
      syncPlayerReservationOverview,
    ],
  );

  return {
    syncPlayerReservationOverview,
    syncPlayerReservationChange,
    syncOwnerReservationOverview,
    syncOwnerReservationChange,
    syncOwnerAvailabilityRange,
    syncReservationChat,
    syncReservationChatInbox,
    syncReservationNotifications,
    syncReservationNotificationEvent,
  };
}
