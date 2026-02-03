"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import type { Channel as StreamChannel } from "stream-chat";
import { StreamChat } from "stream-chat";
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/client";

export function ChatPocClient() {
  const [otherUserId, setOtherUserId] = useState("");
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(
    null,
  );
  const [channelError, setChannelError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [client, setClient] = useState<StreamChat | null>(null);

  const authQuery = trpc.chatPoc.getAuth.useQuery();
  const dmMutation = trpc.chatPoc.getOrCreateDm.useMutation();

  useEffect(() => {
    if (!authQuery.data) {
      return;
    }

    let isCancelled = false;
    setAuthError(null);

    const chatClient = StreamChat.getInstance(authQuery.data.apiKey);

    chatClient
      .connectUser(authQuery.data.user, authQuery.data.token)
      .then(() => {
        if (!isCancelled) {
          setClient(chatClient);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setAuthError(
            error instanceof Error
              ? error.message
              : "Unable to connect to chat.",
          );
        }
      });

    return () => {
      isCancelled = true;
      setClient(null);
      chatClient.disconnectUser();
    };
  }, [authQuery.data]);

  const handleCreateDm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChannelError(null);

    if (!client) {
      setChannelError("Chat client is not ready yet.");
      return;
    }

    const trimmedOtherUserId = otherUserId.trim();
    if (!trimmedOtherUserId) {
      setChannelError("Enter a valid user id.");
      return;
    }

    try {
      const result = await dmMutation.mutateAsync({
        otherUserId: trimmedOtherUserId,
      });

      const channel = client.channel("messaging", result.channelId, {
        members: result.memberIds,
      });

      await channel.watch();
      setActiveChannel(channel);
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

  if (authQuery.isLoading || !authQuery.data) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading chat…</div>
    );
  }

  if (authError) {
    return <div className="p-6 text-sm text-destructive">{authError}</div>;
  }

  if (!client) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Connecting to chat…
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Chat PoC</h1>
        <p className="text-sm text-muted-foreground">
          Connected as {authQuery.data.user.id}
        </p>
      </div>

      <Chat client={client} theme="messaging light">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4 rounded-lg border bg-background p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Start a DM</p>
              <p className="text-xs text-muted-foreground">
                Enter the other user’s UUID to open a channel.
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleCreateDm}>
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
          </aside>

          <div className="min-h-[640px] rounded-lg border bg-background">
            {activeChannel ? (
              <Channel channel={activeChannel} key={activeChannel.cid}>
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageInput focus />
                </Window>
                <Thread />
              </Channel>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                Create a DM to start chatting.
              </div>
            )}
          </div>
        </div>
      </Chat>
    </div>
  );
}
