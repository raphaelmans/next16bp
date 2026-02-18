"use client";

import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import { ChevronLeft, MessageSquare, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Attachment, LocalMessage, StreamChat } from "stream-chat";
import { getClientErrorMessage } from "@/common/toast/errors";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { validateChatUploadFiles } from "../../constants/upload-policy";
import { useModStreamChannel } from "../../hooks/useModStreamChannel";

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

const SYSTEM_RESERVATION_MESSAGE_ID_SUFFIXES = [
  ":player-created:v1",
  ":player-payment-marked:v1",
  ":owner-confirmed:v1",
] as const;

function isSystemReservationMessage(msg: LocalMessage): boolean {
  if (typeof msg.id !== "string") {
    return false;
  }

  return SYSTEM_RESERVATION_MESSAGE_ID_SUFFIXES.some((suffix) =>
    msg.id.endsWith(suffix),
  );
}

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

export interface StreamChatThreadProps {
  client: StreamChat | null;
  channelId: string | null;
  channelType?: string;
  members?: string[] | null;
  myUserId: string | null;
  headerTitle?: string;
  headerSubtitle?: string;
  headerStatus?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  minHeightClassName?: string;
  onBack?: () => void;
  backButtonLabel?: string;
  onRefreshContext?: (() => Promise<void>) | null;
  isContextRefreshing?: boolean;
  onSendMessage?:
    | ((payload: {
        text?: string;
        attachments?: Array<{
          type?: string;
          asset_url?: string;
          image_url?: string;
          thumb_url?: string;
          title?: string;
          file_size?: number;
          mime_type?: string;
        }>;
      }) => Promise<void>)
    | null;
}

export function StreamChatThread({
  client,
  channelId,
  channelType = "messaging",
  members = null,
  myUserId,
  headerTitle = "Messages",
  headerSubtitle,
  headerStatus,
  readOnly = false,
  readOnlyReason,
  emptyTitle = "No messages yet",
  emptyDescription = "Say hi to start the conversation",
  minHeightClassName = "min-h-[520px]",
  onBack,
  backButtonLabel = "Back",
  onRefreshContext = null,
  isContextRefreshing = false,
  onSendMessage = null,
}: StreamChatThreadProps) {
  const [sendStatus, setSendStatus] = useState<ChatStatus>("ready");
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);
  const [isHeaderRefreshing, setIsHeaderRefreshing] = useState(false);

  const {
    channel,
    messages,
    isWatching,
    isRefreshing,
    error: channelWatchError,
    sendMessage,
    refresh,
    markRead,
  } = useModStreamChannel({
    client,
    channelType,
    channelId,
    members,
  });

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
      setSendErrorMessage(null);

      try {
        if (hasFiles) {
          const files = await Promise.all(message.files.map(filePartToFile));
          const uploadValidationError = validateChatUploadFiles(files);
          if (uploadValidationError) {
            throw new Error(uploadValidationError);
          }

          const uploads = await Promise.all(
            files.map(async (file) => {
              const result = await channel.sendFile(file);
              return { file, url: result.file };
            }),
          );

          const messageAttachments = uploads.map(({ file, url }) => ({
            type: file.type.startsWith("image/") ? "image" : "file",
            asset_url: url,
            title: file.name,
            file_size: file.size,
            mime_type: file.type,
          }));
          const attachments: Attachment[] = messageAttachments;

          if (onSendMessage) {
            await onSendMessage({
              text: hasText ? text : undefined,
              attachments: messageAttachments,
            });
          } else {
            await sendMessage({
              text: hasText ? text : undefined,
              attachments,
            });
          }
        } else {
          if (onSendMessage) {
            await onSendMessage({ text });
          } else {
            await sendMessage({ text });
          }
        }

        setSendStatus("ready");
      } catch (error) {
        setSendErrorMessage(
          getClientErrorMessage(
            error,
            "Unable to send message. Please try again.",
          ),
        );
        setSendStatus("error");
      }
    },
    [channel, onSendMessage, sendMessage],
  );

  const statusClassName =
    headerStatus === "CONFIRMED"
      ? "bg-success/10 text-success border-success/20"
      : headerStatus === "CANCELLED" || headerStatus === "EXPIRED"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-warning/10 text-warning border-warning/20";

  const isRefreshBusy =
    isRefreshing || isContextRefreshing || isHeaderRefreshing;

  const handleRefresh = useCallback(async () => {
    if (isRefreshBusy) {
      return;
    }

    setIsHeaderRefreshing(true);
    try {
      await refresh();
      if (onRefreshContext) {
        await onRefreshContext();
      }
    } finally {
      setIsHeaderRefreshing(false);
    }
  }, [isRefreshBusy, onRefreshContext, refresh]);

  return (
    <div
      className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden ${minHeightClassName}`}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-start gap-2">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onBack}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{backButtonLabel}</span>
            </Button>
          ) : null}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {headerStatus ? (
                <Badge
                  variant="outline"
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClassName}`}
                >
                  {headerStatus}
                </Badge>
              ) : null}
              <div className="truncate text-sm font-medium">{headerTitle}</div>
            </div>
            {headerSubtitle ? (
              <div className="truncate text-xs text-muted-foreground mt-0.5">
                {headerSubtitle}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={(!channel && !onRefreshContext) || isRefreshBusy}
            onClick={() => handleRefresh().catch(() => undefined)}
          >
            <RefreshCw
              className={isRefreshBusy ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden p-3">
          <Conversation className="h-full min-h-0 min-w-0 overflow-hidden">
            <ConversationContent>
              {readOnlyReason ? (
                <div className="mb-3 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {readOnlyReason}
                </div>
              ) : null}
              {channelWatchError ? (
                <div className="text-sm text-destructive">
                  {channelWatchError instanceof Error
                    ? channelWatchError.message
                    : "Failed to load messages."}
                </div>
              ) : null}

              {!channelId ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="Select a conversation"
                  description="Pick a reservation to start messaging"
                />
              ) : !channel ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="Connecting"
                  description="Warming up the chat…"
                />
              ) : renderedMessages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title={emptyTitle}
                  description={emptyDescription}
                />
              ) : (
                renderedMessages.map((msg: LocalMessage) => {
                  const isMine = myUserId ? msg.user?.id === myUserId : false;
                  const from: UIMessage["role"] = isMine ? "user" : "assistant";

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
                    <Message from={from} key={msg.id ?? String(msg.created_at)}>
                      <MessageContent>
                        {msg.text ? (
                          <MessageResponse>{msg.text}</MessageResponse>
                        ) : null}

                        {attachments.length > 0 &&
                        !isSystemReservationMessage(msg) ? (
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

        {readOnly ? (
          <div className="border-t px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-xs text-muted-foreground">
            This conversation is archived and read-only.
          </div>
        ) : (
          <div className="border-t px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
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
                  placeholder={channel ? "Write a message…" : ""}
                  disabled={!channel}
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputSubmit status={sendStatus} disabled={!channel} />
              </PromptInputFooter>
            </PromptInput>
            {sendErrorMessage ? (
              <div className="mt-2 text-xs text-destructive">
                {sendErrorMessage}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
