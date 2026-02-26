"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useMutReservationChatSendMessage,
  useQueryReservationChatSession,
} from "../hooks/use-chat-trpc";
import { ChatThread } from "./chat-thread/chat-thread";

const CHAT_ENABLED_STATUSES = [
  "AWAITING_PAYMENT",
  "PAYMENT_MARKED_BY_USER",
  "CONFIRMED",
] as const;

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

  const sessionQuery = useQueryReservationChatSession(
    { reservationId },
    { enabled: isChatEnabled },
  );

  const sendMessageMutation = useMutReservationChatSendMessage();

  const session = sessionQuery.data;
  const threadId = session?.channel.channelId ?? null;
  const myUserId = session?.auth.user.id ?? null;

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
            headerTitle="Messages"
            emptyTitle="No messages yet"
            emptyDescription="Say hi to start the conversation"
            minHeightClassName="min-h-[520px]"
            onRefreshContext={async () => {
              await sessionQuery.refetch();
            }}
            isContextRefreshing={sessionQuery.isRefetching}
            onSendMessage={async (payload) => {
              await sendMessageMutation.mutateAsync({
                reservationId,
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
