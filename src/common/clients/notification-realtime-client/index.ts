"use client";

import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/common/clients/supabase-browser-client";

export type NotificationRealtimeConnectionStatus =
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CLOSED"
  | "CHANNEL_ERROR";

export type UserNotificationEventRow = {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  body: string | null;
  href: string | null;
  created_at: string;
};

export interface NotificationRealtimeClientSubscription {
  channelName: string;
  unsubscribe: () => void;
}

export interface SubscribeUserNotificationEventsInput {
  userId: string;
  onInsert: (row: UserNotificationEventRow) => void;
  onError?: (error: unknown) => void;
  onStatusChange?: (status: NotificationRealtimeConnectionStatus) => void;
}

const USER_NOTIFICATION_TABLE = "user_notification";

const CONNECTION_STATUSES = new Set<NotificationRealtimeConnectionStatus>([
  "SUBSCRIBED",
  "TIMED_OUT",
  "CLOSED",
  "CHANNEL_ERROR",
]);

const isNotificationRealtimeConnectionStatus = (
  value: string,
): value is NotificationRealtimeConnectionStatus =>
  CONNECTION_STATUSES.has(value as NotificationRealtimeConnectionStatus);

const isUserNotificationEventRow = (
  value: unknown,
): value is UserNotificationEventRow => {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.user_id === "string" &&
    typeof row.event_type === "string" &&
    typeof row.title === "string" &&
    typeof row.created_at === "string"
  );
};

const createChannelName = () =>
  `notification-stream:${Date.now()}:${Math.random().toString(36).slice(2)}`;

export class NotificationRealtimeClient {
  subscribeToUserNotificationEvents(
    input: SubscribeUserNotificationEventsInput,
  ): NotificationRealtimeClientSubscription {
    const supabase = getSupabaseBrowserClient();
    const channelName = createChannelName();
    let channel: RealtimeChannel | null = supabase.channel(channelName);

    channel = channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: USER_NOTIFICATION_TABLE,
      },
      (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
        const row = payload.new;
        if (!isUserNotificationEventRow(row)) {
          input.onError?.(
            new Error("Invalid user_notification realtime payload"),
          );
          return;
        }

        if (row.user_id !== input.userId) return;

        input.onInsert(row);
      },
    );

    channel.subscribe((status, error) => {
      if (error) {
        input.onError?.(error);
        return;
      }

      if (isNotificationRealtimeConnectionStatus(status)) {
        input.onStatusChange?.(status);
      }
    });

    return {
      channelName,
      unsubscribe: () => {
        if (!channel) return;
        void supabase.removeChannel(channel);
        channel = null;
      },
    };
  }
}

const NOTIFICATION_REALTIME_CLIENT_SINGLETON = new NotificationRealtimeClient();

export const getNotificationRealtimeClient = () =>
  NOTIFICATION_REALTIME_CLIENT_SINGLETON;
