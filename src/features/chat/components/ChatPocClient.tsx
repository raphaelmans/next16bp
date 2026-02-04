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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/client";
import { useStreamChannel } from "../hooks/useStreamChannel";
import { useStreamClient } from "../hooks/useStreamClient";

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

  const url = urlCandidate;

  const filename = attachment.title ?? "Attachment";
  const mediaType = attachment.mime_type ?? "application/octet-stream";

  return {
    id,
    type: "file",
    url,
    filename,
    mediaType,
  };
};

async function filePartToFile(part: FileUIPart): Promise<File> {
  const url = part.url;
  if (!url) {
    throw new Error("Attachment has no url");
  }

  const response = await fetch(url);
  const blob = await response.blob();
  const filename = part.filename ?? "attachment";
  const type = part.mediaType ?? blob.type;
  return new File([blob], filename, { type });
}

export function ChatPocClient() {
  const [otherUserId, setOtherUserId] = useState("");
  const [channelId, setChannelId] = useState<string | null>(null);
  const [members, setMembers] = useState<string[] | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<ChatStatus>("ready");

  const authQuery = trpc.chatPoc.getAuth.useQuery();
  const dmMutation = trpc.chatPoc.getOrCreateDm.useMutation();

  const auth = authQuery.data;
  const {
    client,
    isReady,
    error: clientError,
  } = useStreamClient(
    auth
      ? {
          apiKey: auth.apiKey,
          user: auth.user,
          tokenOrProvider: auth.token,
        }
      : {
          apiKey: "",
          user: { id: "" },
          tokenOrProvider: "",
        },
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
  } = useStreamChannel({
    client: isReady ? client : null,
    channelType: "messaging",
    channelId,
    members,
  });

  const myUserId = auth?.user.id ?? null;

  useEffect(() => {
    if (!channel || !isWatching) {
      return;
    }
    markRead().catch(() => undefined);
  }, [channel, isWatching, markRead]);

  const renderedMessages = useMemo(() => {
    return messages.filter((m) => !m.deleted_at);
  }, [messages]);

  const openDm = async () => {
    setChannelError(null);

    const trimmedOtherUserId = otherUserId.trim();
    if (!trimmedOtherUserId) {
      setChannelError("Enter a valid user id.");
      return;
    }

    try {
      const result = await dmMutation.mutateAsync({
        otherUserId: trimmedOtherUserId,
      });
      setChannelId(result.channelId);
      setMembers(result.memberIds);
    } catch (error) {
      setChannelError(
        error instanceof Error ? error.message : "Failed to open DM channel.",
      );
    }
  };

  const handleOpenDm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await openDm();
  };

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

          if (hasText) {
            const attachments: Attachment[] = [];
            const uploads = await Promise.all(
              files.map(async (file) => {
                const result = await channel.sendFile(file);
                return { file, url: result.file };
              }),
            );

            for (const upload of uploads) {
              attachments.push({
                type: upload.file.type.startsWith("image/") ? "image" : "file",
                asset_url: upload.url,
                title: upload.file.name,
                file_size: upload.file.size,
                mime_type: upload.file.type,
              });
            }

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

  if (authQuery.isError) {
    return (
      <div className="p-6 text-sm text-destructive">
        {authQuery.error.message}
      </div>
    );
  }

  if (authQuery.isLoading || !auth) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading chat…</div>
    );
  }

  if (clientError) {
    return (
      <div className="p-6 text-sm text-destructive">
        {clientError instanceof Error
          ? clientError.message
          : "Unable to connect to chat."}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Chat PoC</h1>
        <p className="text-sm text-muted-foreground">
          Connected as {auth.user.id}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4 rounded-lg border bg-background p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Start a DM</p>
            <p className="text-xs text-muted-foreground">
              Enter the other user’s UUID to open a channel.
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleOpenDm}>
            <div className="space-y-2">
              <Label htmlFor="other-user-id">Other user id</Label>
              <Input
                id="other-user-id"
                name="otherUserId"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={otherUserId}
                onChange={(event) => setOtherUserId(event.target.value)}
              />
            </div>

            {channelError ? (
              <p className="text-xs text-destructive">{channelError}</p>
            ) : null}

            <Button
              type="submit"
              disabled={dmMutation.isPending || !otherUserId.trim()}
            >
              {dmMutation.isPending ? "Opening…" : "Open DM"}
            </Button>
          </form>

          {channelId ? (
            <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
              <div>Channel: {channelId}</div>
            </div>
          ) : null}
        </aside>

        <div className="flex min-h-[640px] flex-col rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-sm font-medium">Messages</div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!channel || renderedMessages.length === 0}
              onClick={() => loadMore().catch(() => undefined)}
            >
              Load older
            </Button>
          </div>

          <div className="flex flex-1 flex-col">
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
                    title="Create a DM"
                    description="Open a DM channel to start chatting"
                  />
                ) : renderedMessages.length === 0 ? (
                  <ConversationEmptyState
                    icon={<MessageSquare className="size-12" />}
                    title="No messages yet"
                    description="Say hi to start the conversation"
                  />
                ) : (
                  renderedMessages.map((msg: LocalMessage) => {
                    const isMine = myUserId ? msg.user?.id === myUserId : false;
                    const aiFrom: UIMessage["role"] = isMine
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
                        from={aiFrom}
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
                    placeholder={
                      channel ? "Write a message…" : "Open a DM to chat"
                    }
                    disabled={!channel}
                  />
                </PromptInputBody>

                <PromptInputFooter>
                  <PromptInputSubmit status={sendStatus} disabled={!channel} />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
