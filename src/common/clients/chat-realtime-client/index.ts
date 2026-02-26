"use client";

import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/common/clients/supabase-browser-client";

export type ChatRealtimeConnectionStatus =
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CLOSED"
  | "CHANNEL_ERROR";

export type ChatMessageRow = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  content: string | null;
  attachments: unknown;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export interface ChatRealtimeClientSubscription {
  channelName: string;
  unsubscribe: () => void;
}

export interface SubscribeChatMessagesInput {
  threadIds?: string[];
  onInsert: (row: ChatMessageRow) => void;
  onError?: (error: unknown) => void;
  onStatusChange?: (status: ChatRealtimeConnectionStatus) => void;
}

export interface IChatRealtimeClient {
  subscribeToChatMessages(
    input: SubscribeChatMessagesInput,
  ): ChatRealtimeClientSubscription;
}

const CHAT_MESSAGE_SCHEMA = "public";
const CHAT_MESSAGE_TABLE = "chat_message";

const CONNECTION_STATUSES = new Set<ChatRealtimeConnectionStatus>([
  "SUBSCRIBED",
  "TIMED_OUT",
  "CLOSED",
  "CHANNEL_ERROR",
]);

const sanitizeThreadIds = (threadIds?: string[]) =>
  Array.from(
    new Set(
      (threadIds ?? []).map((id) => id.trim()).filter((id) => id.length > 0),
    ),
  );

const buildThreadIdFilter = (threadIds?: string[]) => {
  const ids = sanitizeThreadIds(threadIds);
  if (ids.length === 0) return undefined;
  if (ids.length === 1) return `thread_id=eq.${ids[0]}`;
  return `thread_id=in.(${ids.join(",")})`;
};

const isChatRealtimeConnectionStatus = (
  value: string,
): value is ChatRealtimeConnectionStatus =>
  CONNECTION_STATUSES.has(value as ChatRealtimeConnectionStatus);

const isChatMessageRow = (value: unknown): value is ChatMessageRow => {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.thread_id === "string" &&
    typeof row.sender_user_id === "string" &&
    (typeof row.content === "string" || row.content === null) &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string"
  );
};

const createChannelName = () =>
  `chat-message-stream:${Date.now()}:${Math.random().toString(36).slice(2)}`;

const subscribeToChatMessages = (
  input: SubscribeChatMessagesInput,
): ChatRealtimeClientSubscription => {
  const supabase = getSupabaseBrowserClient();
  const channelName = createChannelName();
  const filter = buildThreadIdFilter(input.threadIds);

  let channel: RealtimeChannel | null = supabase.channel(channelName);

  channel = channel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: CHAT_MESSAGE_SCHEMA,
      table: CHAT_MESSAGE_TABLE,
      ...(filter ? { filter } : {}),
    },
    (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
      const row = payload.new;
      if (!isChatMessageRow(row)) {
        input.onError?.(
          new Error("Invalid chat_message realtime payload received"),
        );
        return;
      }
      input.onInsert(row);
    },
  );

  channel.subscribe((status, error) => {
    if (error) {
      input.onError?.(error);
      return;
    }

    if (isChatRealtimeConnectionStatus(status)) {
      input.onStatusChange?.(status);
      return;
    }

    input.onError?.(
      new Error(`Unknown realtime subscription status: ${String(status)}`),
    );
  });

  return {
    channelName,
    unsubscribe: () => {
      if (!channel) return;
      void supabase.removeChannel(channel);
      channel = null;
    },
  };
};

export class ChatRealtimeClient implements IChatRealtimeClient {
  subscribeToChatMessages(
    input: SubscribeChatMessagesInput,
  ): ChatRealtimeClientSubscription {
    return subscribeToChatMessages(input);
  }
}

export type ChatRealtimeClientDeps = {
  client?: IChatRealtimeClient;
};

export const createChatRealtimeClient = (
  deps: ChatRealtimeClientDeps = {},
): IChatRealtimeClient => deps.client ?? new ChatRealtimeClient();

const CHAT_REALTIME_CLIENT_SINGLETON = createChatRealtimeClient();

export const getChatRealtimeClient = () => CHAT_REALTIME_CLIENT_SINGLETON;
