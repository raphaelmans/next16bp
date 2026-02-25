"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getNotificationsApi } from "../api.runtime";

const notificationsApi = getNotificationsApi();

export function useQueryNotificationUnreadCount(options?: {
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;

  return useFeatureQuery(
    ["userNotification", "unreadCount"],
    notificationsApi.queryUserNotificationUnreadCount,
    undefined,
    {
      enabled,
      refetchInterval: 15_000,
      refetchOnWindowFocus: true,
    },
  ) as ReturnType<typeof useFeatureQuery> & {
    data: { count: number } | undefined;
  };
}

export function useQueryNotificationInbox(
  input?: {
    limit?: number;
    offset?: number;
  },
  options?: {
    enabled?: boolean;
  },
) {
  const enabled = options?.enabled ?? true;
  const queryInput = {
    limit: input?.limit ?? 20,
    offset: input?.offset ?? 0,
  };

  return useFeatureQuery(
    ["userNotification", "listMy"],
    notificationsApi.queryUserNotificationListMy,
    queryInput,
    {
      enabled,
      staleTime: 15_000,
    },
  ) as ReturnType<typeof useFeatureQuery> & {
    data:
      | {
          items: Array<{
            id: string;
            title: string;
            body: string | null;
            href: string | null;
            eventType: string;
            readAt: string | null;
            createdAt: string;
          }>;
          hasMore: boolean;
          limit: number;
          offset: number;
        }
      | undefined;
  };
}

export function useMutNotificationMarkAsRead() {
  const utils = trpc.useUtils();

  return useFeatureMutation(notificationsApi.mutUserNotificationMarkAsRead, {
    onSettled: async () => {
      await Promise.all([
        utils.userNotification.unreadCount.invalidate(),
        utils.userNotification.listMy.invalidate(),
      ]);
    },
  });
}

export function useMutNotificationMarkAllAsRead() {
  const utils = trpc.useUtils();

  return useFeatureMutation(notificationsApi.mutUserNotificationMarkAllAsRead, {
    onSettled: async () => {
      await Promise.all([
        utils.userNotification.unreadCount.invalidate(),
        utils.userNotification.listMy.invalidate(),
      ]);
    },
  });
}
