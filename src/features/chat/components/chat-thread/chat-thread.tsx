"use client";

import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import { ChevronLeft, MessageSquare, RefreshCw } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { isSystemReservationMessageId } from "@/lib/modules/chat/shared/domain";
import type { ChatMessageAttachment } from "@/lib/shared/infra/db/schema/chat-message";
import { getChatStatusBadgeClassName } from "../../domain";
import {
  type ChatMessageItem,
  useSupabaseChatChannel,
} from "../../hooks/useSupabaseChatChannel";

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

const chatAttachmentToAiFile = (
  attachment: ChatMessageAttachment,
  id: string,
): (FileUIPart & { id: string }) | null => {
  const urlCandidate = attachment.url;
  if (typeof urlCandidate !== "string" || urlCandidate.length === 0) {
    return null;
  }

  return {
    id,
    type: "file",
    url: urlCandidate,
    filename: attachment.filename ?? "Attachment",
    mediaType: attachment.mimeType ?? "application/octet-stream",
  };
};

export interface ChatThreadProps {
  threadId: string | null;
  myUserId: string | null;
  headerTitle?: string;
  headerSubtitle?: string;
  headerStatus?: string;
  contextContent?: ReactNode;
  readOnly?: boolean;
  readOnlyReason?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  minHeightClassName?: string;
  onBack?: () => void;
  backButtonLabel?: string;
  onRefreshContext?: (() => Promise<void>) | null;
  isContextRefreshing?: boolean;
  archiveActionLabel?: string;
  onArchiveAction?: (() => Promise<void>) | null;
  isArchiveActionBusy?: boolean;
  onSendMessage?:
    | ((payload: {
        text?: string;
        attachments?: Array<{
          type?: string;
          url?: string;
          filename?: string;
          mimeType?: string;
          fileSize?: number;
        }>;
      }) => Promise<void>)
    | null;
}

export function ChatThread({
  threadId,
  myUserId,
  headerTitle = "Messages",
  headerSubtitle,
  headerStatus,
  contextContent = null,
  readOnly = false,
  readOnlyReason,
  emptyTitle = "No messages yet",
  emptyDescription = "Say hi to start the conversation",
  minHeightClassName = "min-h-[520px]",
  onBack,
  backButtonLabel = "Back",
  onRefreshContext = null,
  isContextRefreshing = false,
  archiveActionLabel,
  onArchiveAction = null,
  isArchiveActionBusy = false,
  onSendMessage = null,
}: ChatThreadProps) {
  const [sendStatus, setSendStatus] = useState<ChatStatus>("ready");
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);
  const [isHeaderRefreshing, setIsHeaderRefreshing] = useState(false);

  const {
    messages,
    isWatching,
    isRefreshing,
    error: channelError,
    refresh,
    markRead,
  } = useSupabaseChatChannel({
    threadId,
  });

  useEffect(() => {
    if (!threadId || !isWatching) {
      return;
    }
    markRead().catch(() => undefined);
  }, [threadId, isWatching, markRead]);

  const renderedMessages = useMemo(
    () => messages.filter((m) => !m.deletedAt),
    [messages],
  );

  const handleSend = useCallback(
    async (message: PromptInputMessage) => {
      if (!threadId) {
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
        const mappedAttachments = hasFiles
          ? message.files.map((file) => ({
              type: file.mediaType?.startsWith("image/") ? "image" : "file",
              url: file.url,
              filename: file.filename,
              mimeType: file.mediaType,
            }))
          : undefined;

        if (onSendMessage) {
          await onSendMessage({
            text: hasText ? text : undefined,
            attachments: mappedAttachments,
          });
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
    [threadId, onSendMessage],
  );

  const statusClassName = getChatStatusBadgeClassName(headerStatus);

  const isRefreshBusy =
    isRefreshing || isContextRefreshing || isHeaderRefreshing;
  const canRunArchiveAction = Boolean(onArchiveAction && archiveActionLabel);

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
          {canRunArchiveAction ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isArchiveActionBusy}
              onClick={() => onArchiveAction?.().catch(() => undefined)}
            >
              {archiveActionLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={(!threadId && !onRefreshContext) || isRefreshBusy}
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
              {contextContent ? (
                <div className="mb-3">{contextContent}</div>
              ) : null}
              {channelError ? (
                <div className="text-sm text-destructive">
                  {channelError instanceof Error
                    ? channelError.message
                    : "Failed to load messages."}
                </div>
              ) : null}

              {!threadId ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="Select a conversation"
                  description="Pick a reservation to start messaging"
                />
              ) : renderedMessages.length === 0 ? (
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title={emptyTitle}
                  description={emptyDescription}
                />
              ) : (
                renderedMessages.map((msg: ChatMessageItem) => {
                  const isMine = myUserId
                    ? msg.senderUserId === myUserId
                    : false;
                  const from: UIMessage["role"] = isMine ? "user" : "assistant";

                  const attachments = (msg.attachments ?? [])
                    .map((a, index) =>
                      chatAttachmentToAiFile(a, `${msg.id}-${index}`),
                    )
                    .filter(
                      (a): a is FileUIPart & { id: string } => a !== null,
                    );

                  return (
                    <Message from={from} key={msg.id}>
                      <MessageContent>
                        {msg.content ? (
                          <MessageResponse>{msg.content}</MessageResponse>
                        ) : null}

                        {attachments.length > 0 &&
                        !isSystemReservationMessageId(msg.id) ? (
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
                  placeholder={threadId ? "Write a message..." : ""}
                  disabled={!threadId}
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputSubmit status={sendStatus} disabled={!threadId} />
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
