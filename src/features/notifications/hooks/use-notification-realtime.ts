"use client";

import { useEffect } from "react";
import { getNotificationRealtimeClient } from "@/common/clients/notification-realtime-client";
import { trpc } from "@/trpc/client";

const notificationRealtimeClient = getNotificationRealtimeClient();

export function useNotificationRealtime(userId: string | null) {
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!userId) return;

    const subscription =
      notificationRealtimeClient.subscribeToUserNotificationEvents({
        userId,
        onInsert: () => {
          void utils.userNotification.unreadCount.invalidate();
          void utils.userNotification.listMy.invalidate();
        },
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, utils]);
}
