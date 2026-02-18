"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreamChatThread } from "@/features/chat/components/chat-thread/stream-chat-thread";
import { useModStreamClient } from "@/features/chat/hooks";
import {
  useMutOpenPlayChatSendMessage,
  useQueryOpenPlayChatSession,
} from "@/features/open-play/hooks";

export function OpenPlayChatPanel({ openPlayId }: { openPlayId: string }) {
  const sessionQuery = useQueryOpenPlayChatSession(openPlayId);
  const sendMessageMutation = useMutOpenPlayChatSendMessage();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Chat</CardTitle>
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
          <StreamChatThread
            client={isReady ? client : null}
            channelId={session?.channel.channelId ?? null}
            channelType={session?.channel.channelType ?? "messaging"}
            members={session?.channel.memberIds ?? null}
            myUserId={session?.auth.user.id ?? null}
            headerTitle={session?.meta.place.name ?? "Open Play"}
            headerSubtitle={
              session?.meta
                ? `${session.meta.sport.name} • ${session.meta.court.label}`
                : undefined
            }
            minHeightClassName="min-h-[520px]"
            onRefreshContext={async () => {
              await sessionQuery.refetch();
            }}
            isContextRefreshing={sessionQuery.isRefetching}
            onSendMessage={async (payload) => {
              await sendMessageMutation.mutateAsync({
                openPlayId,
                text: payload.text,
                attachments: payload.attachments,
              });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
