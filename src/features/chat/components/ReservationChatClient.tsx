"use client";

import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import { MessageSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Attachment, LocalMessage } from "stream-chat";
import {
  Attachment as AiAttachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateChatUploadFiles } from "../constants/upload-policy";
import { useQueryReservationChatSession } from "../hooks/use-chat-trpc";
import { useModStreamChannel } from "../hooks/useModStreamChannel";
import { useModStreamClient } from "../hooks/useModStreamClient";

const CHAT_ENABLED_STATUSES = [
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
  "CONFIRMED",
] as const;

function PromptInputAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((file) => (
        <AiAttachment
          data={file}
          key={file.id}
          onRemove={() => attachments.remove(file.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </AiAttachment>
      ))}
    </Attachments>
  );
}

const streamAttachmentToAiFile = (
  attachment: Attachment,
  id: string,
): (FileUIPart & { id: string }) | null => {
  const urlCandidate =
    attachment.asset_url ?? attachment.image_url ?? attachment.thumb_url;
  if (typeof urlCandidate !== "string" || urlCandidate.length === 0) {
    return null;
  }

  return {
    id,
    type: "file",
    url: urlCandidate,
    filename: attachment.title ?? "Attachment",
    mediaType: attachment.mime_type ?? "application/octet-stream",
  };
};

async function filePartToFile(part: FileUIPart): Promise<File> {
  const url = part.url;
  if (!url) {
    throw new Error("Attachment has no url");
  }

  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], part.filename ?? "attachment", {
    type: part.mediaType ?? blob.type,
  });
}

export interface ReservationChatClientProps {
  reservationId: string;
  reservationStatus: string;
}

export function ReservationChatClient({
  reservationId,
  reservationStatus,
}: ReservationChatClientProps) {
  const isChatEnabled = (CHAT_ENABLED_STATUSES as readonly string[]).includes(
    reservationStatus,
  );

  const [sendStatus, setSendStatus] = useState<ChatStatus>("ready");

  const sessionQuery = useQueryReservationChatSession(
    { reservationId },
    { enabled: isChatEnabled },
  );

  const session = sessionQuery.data;
  const {
    client,
    isReady,
    error: clientError,
  } = useModStreamClient(
    session
      ? {
          apiKey: session.auth.apiKey,
          user: session.auth.user,
          tokenOrProvider: session.auth.token,
        }
      : { apiKey: null, user: null, tokenOrProvider: null },
  );

  const {
    channel,
    messages,
    isWatching,
    error: channelWatchError,
    sendMessage,
    sendFiles,
    loadMore,
    markRead,
  } = useModStreamChannel({
    client: isReady ? client : null,
    channelType: session?.channel.channelType ?? "messaging",
    channelId: session?.channel.channelId ?? null,
    members: session?.channel.memberIds ?? null,
  });

  const myUserId = session?.auth.user.id ?? null;

  useEffect(() => {
    if (!channel || !isWatching) {
      return;
    }
    markRead().catch(() => undefined);
  }, [channel, isWatching, markRead]);

  const renderedMessages = useMemo(
    () => messages.filter((m) => !m.deleted_at),
    [messages],
  );

  const handleSend = useCallback(
    async (message: PromptInputMessage) => {
      if (!channel) {
        return;
      }

      const text = message.text.trim();
      const hasText = Boolean(text);
      const hasFiles = (message.files?.length ?? 0) > 0;
      if (!hasText && !hasFiles) {
        return;
      }

      setSendStatus("submitted");

      try {
        if (hasFiles) {
          const files = await Promise.all(message.files.map(filePartToFile));
          const uploadValidationError = validateChatUploadFiles(files);
          if (uploadValidationError) {
            throw new Error(uploadValidationError);
          }

          if (hasText) {
            const uploads = await Promise.all(
              files.map(async (file) => {
                const result = await channel.sendFile(file);
                return { file, url: result.file };
              }),
            );

            const attachments: Attachment[] = uploads.map(({ file, url }) => ({
              type: file.type.startsWith("image/") ? "image" : "file",
              asset_url: url,
              title: file.name,
              file_size: file.size,
              mime_type: file.type,
            }));

            await sendMessage({ text, attachments });
          } else {
            await sendFiles(files);
          }
        } else {
          await sendMessage({ text });
        }

        setSendStatus("ready");
      } catch {
        setSendStatus("error");
      }
    },
    [channel, sendFiles, sendMessage],
  );

  if (!isChatEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Chat becomes available after the owner accepts your reservation.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Messages</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!channel || renderedMessages.length === 0}
          onClick={() => loadMore().catch(() => undefined)}
        >
          Load older
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {sessionQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading chat…</div>
        ) : sessionQuery.isError ? (
          <div className="p-6 text-sm text-destructive">
            {sessionQuery.error.message}
          </div>
        ) : clientError ? (
          <div className="p-6 text-sm text-destructive">
            {clientError instanceof Error
              ? clientError.message
              : "Unable to connect to chat."}
          </div>
        ) : (
          <div className="flex min-h-[520px] flex-col">
            <div className="flex-1 p-3">
              <Conversation className="h-full">
                <ConversationContent>
                  {channelWatchError ? (
                    <div className="text-sm text-destructive">
                      {channelWatchError instanceof Error
                        ? channelWatchError.message
                        : "Failed to load channel."}
                    </div>
                  ) : null}

                  {!channel ? (
                    <ConversationEmptyState
                      icon={<MessageSquare className="size-12" />}
                      title="Chat not ready"
                      description="Try refreshing in a moment"
                    />
                  ) : renderedMessages.length === 0 ? (
                    <ConversationEmptyState
                      icon={<MessageSquare className="size-12" />}
                      title="No messages yet"
                      description="Say hi to start the conversation"
                    />
                  ) : (
                    renderedMessages.map((msg: LocalMessage) => {
                      const isMine = myUserId
                        ? msg.user?.id === myUserId
                        : false;
                      const from: UIMessage["role"] = isMine
                        ? "user"
                        : "assistant";

                      const attachments = (msg.attachments ?? [])
                        .map((a, index) =>
                          streamAttachmentToAiFile(
                            a,
                            `${msg.id ?? msg.created_at?.toString() ?? "msg"}-${index}`,
                          ),
                        )
                        .filter(
                          (a): a is FileUIPart & { id: string } => a !== null,
                        );

                      return (
                        <Message
                          from={from}
                          key={msg.id ?? String(msg.created_at)}
                        >
                          <MessageContent>
                            {msg.text ? (
                              <MessageResponse>{msg.text}</MessageResponse>
                            ) : null}

                            {attachments.length > 0 ? (
                              <Attachments variant="grid">
                                {attachments.map((a) => (
                                  <AiAttachment data={a} key={a.id}>
                                    <AttachmentPreview />
                                  </AiAttachment>
                                ))}
                              </Attachments>
                            ) : null}
                          </MessageContent>
                        </Message>
                      );
                    })
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </div>

            <div className="border-t p-3">
              <PromptInput
                className="w-full"
                onSubmit={handleSend}
                globalDrop
                multiple
              >
                <PromptInputHeader>
                  <PromptInputAttachmentsDisplay />
                </PromptInputHeader>
                <PromptInputBody>
                  <PromptInputTextarea
                    placeholder="Write a message…"
                    disabled={!channel}
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputSubmit status={sendStatus} disabled={!channel} />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
