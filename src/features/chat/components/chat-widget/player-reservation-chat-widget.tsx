"use client";

import { MessagesSquare, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone, formatTimeRangeInTimeZone } from "@/common/format";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getPlayerReservationStatusLabel,
  isReservationStatusChatEnabled,
} from "../../domain";
import {
  useMutReservationChatSendMessage,
  useQueryReservationChatSession,
} from "../../hooks/use-chat-trpc";
import { useModStreamClient } from "../../hooks/useModStreamClient";
import { StreamChatThread } from "../chat-thread/stream-chat-thread";

const AUTO_OPEN_PREFIX = "chat:autoOpen:reservation:";

export function PlayerReservationChatWidget({
  reservationId,
  reservationStatus,
}: {
  reservationId: string;
  reservationStatus: string;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const isConfirmed = reservationStatus === "CONFIRMED";
  const isActiveStatus = isReservationStatusChatEnabled(reservationStatus);

  const [open, setOpen] = useState(false);

  const sessionQuery = useQueryReservationChatSession(
    { reservationId },
    { enabled: isActiveStatus },
  );
  const sendMessageMutation = useMutReservationChatSendMessage();

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

  useEffect(() => {
    if (!isConfirmed) return;

    const key = `${AUTO_OPEN_PREFIX}${reservationId}`;
    const alreadyAutoOpened = window.sessionStorage.getItem(key) === "1";
    if (!alreadyAutoOpened) {
      window.sessionStorage.setItem(key, "1");
      setOpen(true);
    }
  }, [isConfirmed, reservationId]);

  const unreadLabel = useMemo(() => {
    // v1: no unread indicator for player without watching global channels.
    return null;
  }, []);

  if (!isActiveStatus) {
    return null;
  }

  const statusLabel = getPlayerReservationStatusLabel(reservationStatus);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
        >
          <MessagesSquare className="h-5 w-5" />
          <span className="sr-only">Open chat</span>
          {unreadLabel ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
              {unreadLabel}
            </Badge>
          ) : null}
        </Button>

        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={
            "flex h-[86vh] flex-col gap-0 p-0 sm:h-full sm:max-w-lg [&>button]:hidden"
          }
        >
          <div className="flex items-start justify-between border-b px-5 py-4">
            <div className="space-y-0.5">
              <SheetTitle className="font-heading">
                Message the venue
              </SheetTitle>
              <SheetDescription className="text-xs">
                {statusLabel} - Reservation{" "}
                {reservationId.slice(0, 8).toUpperCase()}
              </SheetDescription>
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
              Loading chat…
            </div>
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
            <>
              {reservationStatus === "CREATED" ? (
                <div className="border-b bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
                  Waiting for owner confirmation. You can still message the
                  venue.
                </div>
              ) : null}

              <StreamChatThread
                client={isReady ? client : null}
                channelId={session?.channel.channelId ?? null}
                channelType={session?.channel.channelType ?? "messaging"}
                members={session?.channel.memberIds ?? null}
                myUserId={session?.auth.user.id ?? null}
                headerStatus={
                  session?.meta.reservation.status ?? reservationStatus
                }
                headerTitle={session?.meta.place.name ?? "Venue"}
                headerSubtitle={
                  session?.meta
                    ? `${session.meta.court.label} • ${formatInTimeZone(
                        session.meta.reservation.startTimeIso,
                        session.meta.place.timeZone,
                        "EEE MMM d",
                      )} • ${formatTimeRangeInTimeZone(
                        session.meta.reservation.startTimeIso,
                        session.meta.reservation.endTimeIso,
                        session.meta.place.timeZone,
                      )}`
                    : undefined
                }
                minHeightClassName="min-h-0 flex-1"
                onRefreshContext={async () => {
                  await sessionQuery.refetch();
                }}
                isContextRefreshing={sessionQuery.isRefetching}
                onSendMessage={async (payload) => {
                  await sendMessageMutation.mutateAsync({
                    reservationId,
                    text: payload.text,
                    attachments: payload.attachments,
                  });
                }}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
