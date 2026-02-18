"use client";

import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatInTimeZone,
  formatTimeRangeInTimeZone,
} from "@/common/format";
import { Container } from "@/components/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useQueryAuthSession } from "@/features/auth";
import type { AppRouter } from "@/lib/shared/infra/trpc/root";
import {
  useMutCancelOpenPlay,
  useMutCloseOpenPlay,
  useMutDecideOpenPlayParticipant,
  useMutLeaveOpenPlay,
  useMutRequestJoinOpenPlay,
  useQueryOpenPlayDetail,
  useQueryOpenPlayPublicDetail,
} from "../hooks";
import { OpenPlayChatPanel } from "./open-play-chat-panel";
import {
  OpenPlayCostSharingCard,
  OpenPlayDetailErrorState,
  OpenPlayDetailLoadingState,
  OpenPlayDetailNotFoundState,
  OpenPlayParticipantsCard,
  OpenPlayRequestsCard,
  OpenPlayShareCard,
  OpenPlayStatusBadges,
} from "./open-play-detail-sections";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type OpenPlayPublicDetail = RouterOutputs["openPlay"]["getPublicDetail"];
type OpenPlayViewerDetail = RouterOutputs["openPlay"]["getDetail"];

function initials(value: string) {
  const parts = value.trim().split(/\s+/g);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

type OpenPlayDetailPageViewProps = {
  openPlayId: string;
};

export default function OpenPlayDetailPageView({
  openPlayId,
}: OpenPlayDetailPageViewProps) {
  const pathname = usePathname();
  const { data: session } = useQueryAuthSession();
  const isAuthed = Boolean(session);

  const publicQuery = useQueryOpenPlayPublicDetail(
    openPlayId,
    !isAuthed && Boolean(openPlayId),
  );
  const detailQuery = useQueryOpenPlayDetail(
    openPlayId,
    isAuthed && Boolean(openPlayId),
  );

  const data: OpenPlayPublicDetail | OpenPlayViewerDetail | undefined =
    detailQuery.data ?? publicQuery.data;

  const isLoading =
    (!isAuthed && publicQuery.isLoading) || (isAuthed && detailQuery.isLoading);
  const error = (isAuthed ? detailQuery.error : publicQuery.error) ?? null;

  const join = useMutRequestJoinOpenPlay();
  const leave = useMutLeaveOpenPlay();
  const decide = useMutDecideOpenPlayParticipant();
  const close = useMutCloseOpenPlay();
  const cancel = useMutCancelOpenPlay();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const [joinDialogOpen, setJoinDialogOpen] = React.useState(false);
  const [joinMessage, setJoinMessage] = React.useState("");

  React.useEffect(() => {
    if (!joinDialogOpen) {
      setJoinMessage("");
    }
  }, [joinDialogOpen]);

  if (isLoading) {
    return <OpenPlayDetailLoadingState />;
  }

  if (error) {
    return <OpenPlayDetailErrorState message={error.message} />;
  }

  if (!data) {
    return <OpenPlayDetailNotFoundState />;
  }

  const handleRefresh = async () => {
    if (!isAuthed) return;
    setIsRefreshing(true);
    try {
      await detailQuery.refetch();
      await publicQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const timeZone = data.place.timeZone;
  const dateLabel = formatInTimeZone(
    data.openPlay.startsAtIso,
    timeZone,
    "EEE MMM d",
  );
  const timeLabel = formatTimeRangeInTimeZone(
    data.openPlay.startsAtIso,
    data.openPlay.endsAtIso,
    timeZone,
  );

  const viewer = detailQuery.data?.viewer;
  const participants = detailQuery.data?.participants ?? null;
  const costSharing = data.costSharing;
  const reservationTotalLabel = formatCurrency(
    costSharing.reservationTotalPriceCents,
    costSharing.currency,
  );
  const suggestedSplitLabel = formatCurrency(
    costSharing.suggestedSplitPerPlayerCents,
    costSharing.currency,
  );

  const isHost = viewer?.role === "host";
  const myStatus = viewer?.myStatus ?? null;
  const reservationStatus = detailQuery.data?.reservationStatus ?? null;
  const hasStarted = Date.parse(data.openPlay.startsAtIso) <= Date.now();
  const isAutoJoin = data.openPlay.joinPolicy === "AUTO";

  const canChat =
    (reservationStatus ? reservationStatus === "CONFIRMED" : true) &&
    data.openPlay.status !== "CANCELLED" &&
    (isHost || myStatus === "CONFIRMED");

  const joinDisabledReason =
    data.openPlay.status !== "ACTIVE"
      ? data.openPlay.status === "CLOSED"
        ? "This Open Play is closed."
        : data.openPlay.status === "CANCELLED"
          ? "This Open Play is cancelled."
          : "This Open Play is not active."
      : hasStarted
        ? "This Open Play has already started."
        : null;

  const hostActionsDisabled = hasStarted || data.openPlay.status !== "ACTIVE";
  const canCancel = !hasStarted && data.openPlay.status !== "CANCELLED";

  const statusBadgeVariant =
    data.openPlay.status === "ACTIVE"
      ? "secondary"
      : data.openPlay.status === "CLOSED"
        ? "outline"
        : "destructive";
  const statusLabel =
    data.openPlay.status === "ACTIVE"
      ? "Active"
      : data.openPlay.status === "CLOSED"
        ? "Closed"
        : "Cancelled";

  return (
    <Container className="py-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="font-heading">
                    {data.openPlay.title || "Open Play"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.sport.name} • {data.court.label} • {data.place.name}
                  </p>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">{dateLabel}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {timeLabel}
                    </span>
                  </p>
                </div>
                <OpenPlayStatusBadges
                  statusLabel={statusLabel}
                  statusVariant={statusBadgeVariant}
                  availableSpots={data.openPlay.availableSpots}
                  joinPolicy={data.openPlay.joinPolicy}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.openPlay.note ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  {data.openPlay.note}
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={data.host.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {initials(data.host.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {data.host.displayName}
                  </div>
                  <div className="text-xs text-muted-foreground">Host</div>
                </div>
              </div>

              <Separator />

              {isHost &&
              reservationStatus &&
              reservationStatus !== "CONFIRMED" ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="font-medium">Waiting for confirmation</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    This Open Play becomes visible and joinable only after your
                    reservation is confirmed. Sharing the link early will not
                    work for others.
                  </div>
                </div>
              ) : null}

              {hasStarted ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  This Open Play has already started. Joining and approvals are
                  locked.
                </div>
              ) : null}

              {!isAuthed ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {isAutoJoin
                      ? "Sign in to join and access chat."
                      : "Sign in to request to join and access chat."}
                  </div>
                  <Button asChild>
                    <Link href={appRoutes.login.from(pathname)}>Sign in</Link>
                  </Button>
                </div>
              ) : isHost ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    You are hosting this Open Play.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => close.mutate({ openPlayId })}
                      disabled={close.isPending || hostActionsDisabled}
                    >
                      Close
                    </Button>

                    {canCancel ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={cancel.isPending}
                          >
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Cancel Open Play
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel the Open Play and prevent anyone
                              from joining.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => cancel.mutate({ openPlayId })}
                            >
                              Cancel Open Play
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                </div>
              ) : myStatus ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    Status: <span className="font-medium">{myStatus}</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => leave.mutate({ openPlayId })}
                    disabled={leave.isPending}
                  >
                    Leave
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {joinDisabledReason ??
                      (isAutoJoin
                        ? "Join this Open Play."
                        : "Request to join this Open Play.")}
                  </div>
                  {isAutoJoin ? (
                    <Button
                      onClick={() => join.mutate({ openPlayId })}
                      disabled={join.isPending || Boolean(joinDisabledReason)}
                    >
                      Join
                    </Button>
                  ) : (
                    <Dialog
                      open={joinDialogOpen}
                      onOpenChange={setJoinDialogOpen}
                    >
                      <Button
                        onClick={() => setJoinDialogOpen(true)}
                        disabled={join.isPending || Boolean(joinDisabledReason)}
                      >
                        Request to join
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request to join</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="joinMessage">
                              Message to host (optional)
                            </Label>
                            <Textarea
                              id="joinMessage"
                              value={joinMessage}
                              onChange={(e) => setJoinMessage(e.target.value)}
                              placeholder="e.g. Can bring extra balls"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setJoinDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={async () => {
                                try {
                                  await join.mutateAsync({
                                    openPlayId,
                                    message:
                                      joinMessage.trim().length > 0
                                        ? joinMessage.trim()
                                        : undefined,
                                  });
                                  setJoinDialogOpen(false);
                                } catch {
                                  // toast handled by mutation
                                }
                              }}
                              disabled={join.isPending}
                            >
                              Send request
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isHost && participants ? (
            <OpenPlayRequestsCard
              title="Requests"
              participants={participants.requested ?? []}
              emptyMessage="No requests yet."
              helperText={
                costSharing.requiresPayment
                  ? "Paid session tip: use Request and confirm players after payment is received."
                  : undefined
              }
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onConfirm={(participantId) =>
                decide.mutate({ participantId, decision: "CONFIRM" })
              }
              onWaitlist={(participantId) =>
                decide.mutate({ participantId, decision: "WAITLIST" })
              }
              onDecline={(participantId) =>
                decide.mutate({ participantId, decision: "DECLINE" })
              }
              decisionsDisabled={hostActionsDisabled}
              isMutating={decide.isPending}
            />
          ) : null}

          {isHost && participants?.waitlisted ? (
            <OpenPlayRequestsCard
              title="Waitlist"
              participants={participants.waitlisted}
              emptyMessage="No one is waitlisted."
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              onConfirm={(participantId) =>
                decide.mutate({ participantId, decision: "CONFIRM" })
              }
              onDecline={(participantId) =>
                decide.mutate({ participantId, decision: "DECLINE" })
              }
              decisionsDisabled={hostActionsDisabled}
              isMutating={decide.isPending}
            />
          ) : null}

          {canChat ? <OpenPlayChatPanel openPlayId={openPlayId} /> : null}
        </div>

        <div className="space-y-6">
          <OpenPlayCostSharingCard
            reservationTotalLabel={reservationTotalLabel}
            requiresPayment={costSharing.requiresPayment}
            suggestedSplitLabel={suggestedSplitLabel}
            splitBasisPlayers={costSharing.splitBasisPlayers}
            paymentInstructions={costSharing.paymentInstructions}
            paymentLinkUrl={costSharing.paymentLinkUrl}
          />

          <OpenPlayParticipantsCard
            confirmedCount={data.openPlay.confirmedCount}
            maxPlayers={data.openPlay.maxPlayers}
          />

          <OpenPlayShareCard
            onCopyLink={async () => {
              await navigator.clipboard.writeText(
                window.location.origin + appRoutes.openPlay.detail(openPlayId),
              );
            }}
          />
        </div>
      </div>
    </Container>
  );
}
