"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/client";
import {
  useMutChatPocGetOrCreateDm,
  useQueryChatPocAuth,
} from "../hooks/use-chat-trpc";
import { ChatThread } from "./chat-thread/chat-thread";

export function ChatPocClient() {
  const [otherUserId, setOtherUserId] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const authQuery = useQueryChatPocAuth();
  const dmMutation = useMutChatPocGetOrCreateDm();
  const sendMutation = trpc.chatMessage.sendMessage.useMutation();

  const auth = authQuery.data;
  const myUserId = auth?.user.id ?? null;

  const handleOpenDm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setThreadId(result.channelId);
      void utils.reservationChat.getThreadMetas.invalidate();
    } catch (error) {
      setChannelError(
        error instanceof Error ? error.message : "Failed to open DM channel.",
      );
    }
  };

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
              Enter the other user's UUID to open a channel.
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

          {threadId ? (
            <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
              <div>Channel: {threadId}</div>
            </div>
          ) : null}
        </aside>

        <div className="flex min-h-[640px] flex-col rounded-lg border bg-background">
          <ChatThread
            threadId={threadId}
            myUserId={myUserId}
            headerTitle="Messages"
            emptyTitle={threadId ? "No messages yet" : "Create a DM"}
            emptyDescription={
              threadId
                ? "Say hi to start the conversation"
                : "Open a DM channel to start chatting"
            }
            minHeightClassName="min-h-0 flex-1"
            onSendMessage={
              threadId
                ? async (payload) => {
                    await sendMutation.mutateAsync({
                      threadId: threadId,
                      text: payload.text,
                    });
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
