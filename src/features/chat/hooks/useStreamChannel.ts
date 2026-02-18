"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Attachment,
  Channel,
  Event,
  LocalMessage,
  StreamChat,
} from "stream-chat";
import { validateChatUploadFiles } from "../constants/upload-policy";

export interface UseStreamChannelInput {
  client: StreamChat | null;
  channelType: string;
  channelId: string | null;
  members: string[] | null;
  messageLimit?: number;
}

export function useModStreamChannel({
  client,
  channelType,
  channelId,
  members,
  messageLimit = 30,
}: UseStreamChannelInput) {
  const connectedUserId = client
    ? ((client as unknown as { userID?: string }).userID ?? null)
    : null;

  const channel = useMemo(() => {
    if (!client || !channelId || !connectedUserId) {
      return null;
    }

    return client.channel(channelType, channelId, members ? { members } : {});
  }, [client, channelType, channelId, members, connectedUserId]);

  const channelRef = useRef<Channel | null>(null);
  channelRef.current = channel;

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!channel) {
      setMessages([]);
      setIsWatching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsWatching(false);
    setError(null);

    const sync = () => {
      setMessages(channel.state.messages);
    };

    const unsubscribe = channel.on((event: Event) => {
      if (
        event.type === "message.new" ||
        event.type === "message.updated" ||
        event.type === "message.deleted" ||
        event.type === "message.undeleted"
      ) {
        sync();
      }
    });

    channel
      .watch({ messages: { limit: messageLimit } })
      .then(() => {
        if (cancelled) {
          return;
        }
        setIsWatching(true);
        sync();
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err);
        }
      });

    return () => {
      cancelled = true;
      unsubscribe.unsubscribe();
      setIsWatching(false);
    };
  }, [channel, messageLimit]);

  const sendMessage = async (payload: {
    text?: string;
    attachments?: Attachment[];
  }) => {
    const current = channelRef.current;
    if (!current) {
      throw new Error("Channel is not ready");
    }

    await current.sendMessage({
      text: payload.text,
      attachments: payload.attachments,
    });
  };

  const markRead = async () => {
    const current = channelRef.current;
    if (!current) {
      return;
    }
    await current.markRead();
  };

  const loadMore = async (limit = 30) => {
    const current = channelRef.current;
    if (!current) {
      return;
    }

    const currentMessages = current.state.messages;
    const oldest = currentMessages[0];
    if (!oldest?.id) {
      return;
    }

    await current.query({
      messages: {
        limit,
        id_lt: oldest.id,
      },
    });

    setMessages(current.state.messages);
  };

  const refresh = async () => {
    const current = channelRef.current;
    if (!current) {
      return;
    }

    setIsRefreshing(true);
    try {
      if (!isWatching) {
        await current.watch({ messages: { limit: messageLimit } });
        setIsWatching(true);
      } else {
        await current.query({
          messages: {
            limit: messageLimit,
          },
        });
      }

      setMessages(current.state.messages);
    } finally {
      setIsRefreshing(false);
    }
  };

  const sendFiles = async (files: File[]) => {
    const current = channelRef.current;
    if (!current) {
      throw new Error("Channel is not ready");
    }

    const uploadValidationError = validateChatUploadFiles(files);
    if (uploadValidationError) {
      throw new Error(uploadValidationError);
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const result = await current.sendFile(file);
        return {
          file,
          url: result.file,
        };
      }),
    );

    const attachments: Attachment[] = uploads.map(({ file, url }) => {
      const isImage = file.type.startsWith("image/");
      return {
        type: isImage ? "image" : "file",
        asset_url: url,
        title: file.name,
        file_size: file.size,
        mime_type: file.type,
      };
    });

    await sendMessage({ attachments });
  };

  return {
    channel,
    messages,
    isWatching,
    isRefreshing,
    error,
    sendMessage,
    sendFiles,
    loadMore,
    refresh,
    markRead,
  };
}
