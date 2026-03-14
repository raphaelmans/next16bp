"use client";

import { MessageSquare, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatThread } from "@/features/chat/components/chat-thread/chat-thread";
import { isReservationStatusChatEnabled } from "@/features/chat/domain";
import {
  useMutReservationChatSendMessage,
  useQueryReservationChatSession,
} from "@/features/chat/hooks/use-chat-trpc";
import { makeReservationThreadId } from "@/lib/modules/chat/shared/domain";

type CoachReservationChatSheetProps = {
  reservationId: string;
  reservationStatus: string;
  playerName: string;
  subtitle: string;
};

export function CoachReservationChatSheet({
  reservationId,
  reservationStatus,
  playerName,
  subtitle,
}: CoachReservationChatSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const isChatEnabled = isReservationStatusChatEnabled(reservationStatus);
  const [open, setOpen] = useState(false);

  const sessionQuery = useQueryReservationChatSession(
    { reservationId },
    { enabled: isChatEnabled },
  );
  const sendMessageMutation = useMutReservationChatSendMessage();

  const threadId = useMemo(() => {
    if (!sessionQuery.data) {
      return null;
    }

    return makeReservationThreadId(reservationId);
  }, [reservationId, sessionQuery.data]);

  if (!isChatEnabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Chat stays available while the reservation is active.
      </p>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Message Player
      </Button>

      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className="flex h-[86vh] flex-col gap-0 p-0 sm:h-full sm:max-w-lg [&>button]:hidden"
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div className="space-y-0.5">
            <SheetTitle className="font-heading">
              Message {playerName}
            </SheetTitle>
            <SheetDescription className="text-xs">{subtitle}</SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {sessionQuery.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">
            Loading chat...
          </div>
        ) : sessionQuery.isError ? (
          <div className="p-6 text-sm text-destructive">
            {sessionQuery.error.message}
          </div>
        ) : (
          <ChatThread
            threadId={threadId}
            myUserId={sessionQuery.data?.auth.user.id ?? null}
            headerStatus={
              sessionQuery.data?.meta.reservation.status ?? reservationStatus
            }
            headerTitle={playerName}
            headerSubtitle={subtitle}
            emptyDescription="Send a message to coordinate the session."
            minHeightClassName="min-h-0 flex-1"
            onRefreshContext={async () => {
              await sessionQuery.refetch();
            }}
            isContextRefreshing={sessionQuery.isRefetching}
            onSendMessage={async (payload) => {
              await sendMessageMutation.mutateAsync({
                reservationId,
                text: payload.text,
                attachments: payload.attachments?.map((attachment) => ({
                  type: attachment.type,
                  asset_url: attachment.url,
                  title: attachment.filename,
                  file_size: attachment.fileSize,
                  mime_type: attachment.mimeType,
                })),
              });
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
