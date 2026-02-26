"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatThread } from "@/features/chat/components/chat-thread/chat-thread";
import {
  useMutOpenPlayChatSendMessage,
  useQueryOpenPlayChatSession,
} from "@/features/open-play/hooks";

export function OpenPlayChatPanel({ openPlayId }: { openPlayId: string }) {
  const sessionQuery = useQueryOpenPlayChatSession(openPlayId);
  const sendMessageMutation = useMutOpenPlayChatSendMessage();

  const session = sessionQuery.data;
  const threadId = session?.channel.channelId ?? null;
  const myUserId = session?.auth.user.id ?? null;

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
        ) : (
          <ChatThread
            threadId={threadId}
            myUserId={myUserId}
            headerTitle={session?.meta.place.name ?? "Open Play"}
            headerSubtitle={
              session?.meta
                ? `${session.meta.sport.name} • ${session.meta.courts.map((c) => c.label).join(", ")}`
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
                attachments: payload.attachments?.map((a) => ({
                  type: a.type,
                  asset_url: a.url,
                  title: a.filename,
                  file_size: a.fileSize,
                  mime_type: a.mimeType,
                })),
              });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
