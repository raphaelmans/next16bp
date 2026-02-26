"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ChatMessageRow,
  getChatRealtimeClient,
} from "@/common/clients/chat-realtime-client";
import type { ChatMessageAttachment } from "@/lib/shared/infra/db/schema/chat-message";
import { trpc } from "@/trpc/client";

export interface ChatMessageItem {
  id: string;
  threadId: string;
  senderUserId: string;
  content: string | null;
  attachments: ChatMessageAttachment[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UseSupabaseChatChannelInput {
  threadId: string | null;
  messageLimit?: number;
}

export function useSupabaseChatChannel({
  threadId,
  messageLimit = 30,
}: UseSupabaseChatChannelInput) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;

  const utils = trpc.useUtils();

  // Load initial messages via tRPC
  const messagesQuery = trpc.chatMessage.loadMessages.useQuery(
    { threadId: threadId ?? "", limit: messageLimit },
    {
      enabled: Boolean(threadId),
      refetchOnWindowFocus: false,
    },
  );

  // Sync query data to local state
  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data.messages as ChatMessageItem[]);
      setIsWatching(true);
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    if (messagesQuery.error) {
      setError(messagesQuery.error);
    }
  }, [messagesQuery.error]);

  // Reset state when threadId changes
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setIsWatching(false);
      setError(null);
    }
  }, [threadId]);

  // Subscribe to realtime inserts
  useEffect(() => {
    if (!threadId) return;

    const realtimeClient = getChatRealtimeClient();
    const subscription = realtimeClient.subscribeToChatMessages({
      threadIds: [threadId],
      onInsert: (row: ChatMessageRow) => {
        if (row.thread_id !== threadIdRef.current) return;

        const newMessage: ChatMessageItem = {
          id: row.id,
          threadId: row.thread_id,
          senderUserId: row.sender_user_id,
          content: row.content,
          attachments: Array.isArray(row.attachments)
            ? (row.attachments as ChatMessageAttachment[])
            : [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        };

        setMessages((prev) => {
          // Deduplicate by id
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      },
      onError: (err) => {
        setError(err);
      },
      onStatusChange: (status) => {
        if (status === "SUBSCRIBED") {
          setIsWatching(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsWatching(false);
        }
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [threadId]);

  const sendMessage = useCallback(
    async (payload: {
      text?: string;
      attachments?: ChatMessageAttachment[];
    }) => {
      if (!threadIdRef.current) {
        throw new Error("Thread is not ready");
      }

      // Optimistic local append
      const optimisticId = crypto.randomUUID();
      const optimisticMessage: ChatMessageItem = {
        id: optimisticId,
        threadId: threadIdRef.current,
        senderUserId: "", // Will be filled by realtime event
        content: payload.text ?? null,
        attachments: payload.attachments ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // The actual message will be sent via the tRPC mutation (sendMessage) in
      // the parent component (which calls the reservation chat sendMessage endpoint).
      // The realtime subscription will then deliver the real message and the
      // optimistic one will be deduplicated by the parent's onSendMessage handler.
    },
    [],
  );

  const markRead = useCallback(async () => {
    if (!threadIdRef.current) return;
    try {
      await utils.client.chatMessage.markRead.mutate({
        threadId: threadIdRef.current,
      });
    } catch {
      // Best-effort
    }
  }, [utils]);

  const loadMore = useCallback(
    async (limit = 30) => {
      if (!threadIdRef.current) return;

      const oldest = messages[0];
      if (!oldest?.id) return;

      const older = await utils.client.chatMessage.loadMessages.query({
        threadId: threadIdRef.current,
        limit,
        beforeId: oldest.id,
      });

      if (older.messages.length > 0) {
        setMessages((prev) => [
          ...(older.messages as ChatMessageItem[]),
          ...prev,
        ]);
      }
    },
    [messages, utils],
  );

  const refresh = useCallback(async () => {
    if (!threadIdRef.current) return;

    setIsRefreshing(true);
    try {
      await utils.chatMessage.loadMessages.invalidate({
        threadId: threadIdRef.current,
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [utils]);

  return {
    messages,
    isWatching,
    isRefreshing,
    error,
    sendMessage,
    loadMore,
    refresh,
    markRead,
  };
}
