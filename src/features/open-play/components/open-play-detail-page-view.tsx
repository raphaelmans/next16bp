"use client";

import type { inferRouterOutputs } from "@trpc/server";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/features/auth";
import type { AppRouter } from "@/lib/shared/infra/trpc/root";
import {
  useCancelOpenPlay,
  useCloseOpenPlay,
  useDecideOpenPlayParticipant,
  useLeaveOpenPlay,
  useOpenPlayDetail,
  useOpenPlayPublicDetail,
  useRequestJoinOpenPlay,
} from "../hooks";
import { OpenPlayChatPanel } from "./open-play-chat-panel";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type OpenPlayPublicDetail = RouterOutputs["openPlay"]["getPublicDetail"];
type OpenPlayViewerDetail = RouterOutputs["openPlay"]["getDetail"];

function initials(value: string) {
  const parts = value.trim().split(/\s+/g);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export default function OpenPlayDetailPageView() {
  const params = useParams();
  const pathname = usePathname();
  const openPlayId = params.openPlayId as string;
  const { data: session } = useSession();
  const isAuthed = Boolean(session);

  const publicQuery = useOpenPlayPublicDetail(
    openPlayId,
    !isAuthed && Boolean(openPlayId),
  );
  const detailQuery = useOpenPlayDetail(
    openPlayId,
    isAuthed && Boolean(openPlayId),
  );

  const data: OpenPlayPublicDetail | OpenPlayViewerDetail | undefined =
    detailQuery.data ?? publicQuery.data;

  const isLoading =
    (!isAuthed && publicQuery.isLoading) || (isAuthed && detailQuery.isLoading);
  const error = (isAuthed ? detailQuery.error : publicQuery.error) ?? null;

  const join = useRequestJoinOpenPlay();
  const leave = useLeaveOpenPlay();
  const decide = useDecideOpenPlayParticipant();
  const close = useCloseOpenPlay();
  const cancel = useCancelOpenPlay();

  const [joinDialogOpen, setJoinDialogOpen] = React.useState(false);
  const [joinMessage, setJoinMessage] = React.useState("");

  React.useEffect(() => {
    if (!joinDialogOpen) {
      setJoinMessage("");
    }
  }, [joinDialogOpen]);

  if (isLoading) {
    return (
      <Container className="py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-8">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error.message}
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container className="py-8">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Open Play not found.
          </CardContent>
        </Card>
      </Container>
    );
  }

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
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
                  <Badge
                    variant={
                      data.openPlay.availableSpots === 0
                        ? "destructive"
                        : "default"
                    }
                  >
                    {data.openPlay.availableSpots === 0
                      ? "Full"
                      : `${data.openPlay.availableSpots} spot${data.openPlay.availableSpots === 1 ? "" : "s"} left`}
                  </Badge>
                  <Badge variant="outline">
                    {data.openPlay.joinPolicy === "AUTO"
                      ? "Auto-join"
                      : "Request"}
                  </Badge>
                </div>
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
            <Card>
              <CardHeader>
                <CardTitle>Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {costSharing.requiresPayment && isHost ? (
                  <p className="text-xs text-muted-foreground">
                    Paid session tip: use Request and confirm players after
                    payment is received.
                  </p>
                ) : null}
                {participants.requested?.length ? (
                  <div className="space-y-3">
                    {participants.requested.map((p) => (
                      <div
                        key={p.participantId}
                        className="flex items-center justify-between gap-3 rounded-md border p-3"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {p.displayName}
                          </div>
                          {p.message ? (
                            <div className="text-xs text-muted-foreground truncate">
                              {p.message}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              decide.mutate({
                                participantId: p.participantId,
                                decision: "CONFIRM",
                              })
                            }
                            disabled={decide.isPending || hostActionsDisabled}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              decide.mutate({
                                participantId: p.participantId,
                                decision: "WAITLIST",
                              })
                            }
                            disabled={decide.isPending || hostActionsDisabled}
                          >
                            Waitlist
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              decide.mutate({
                                participantId: p.participantId,
                                decision: "DECLINE",
                              })
                            }
                            disabled={decide.isPending || hostActionsDisabled}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No requests yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {isHost && participants?.waitlisted ? (
            <Card>
              <CardHeader>
                <CardTitle>Waitlist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {participants.waitlisted.length ? (
                  <div className="space-y-3">
                    {participants.waitlisted.map((p) => (
                      <div
                        key={p.participantId}
                        className="flex items-center justify-between gap-3 rounded-md border p-3"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {p.displayName}
                          </div>
                          {p.message ? (
                            <div className="text-xs text-muted-foreground truncate">
                              {p.message}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              decide.mutate({
                                participantId: p.participantId,
                                decision: "CONFIRM",
                              })
                            }
                            disabled={decide.isPending || hostActionsDisabled}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              decide.mutate({
                                participantId: p.participantId,
                                decision: "DECLINE",
                              })
                            }
                            disabled={decide.isPending || hostActionsDisabled}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No one is waitlisted.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {canChat ? <OpenPlayChatPanel openPlayId={openPlayId} /> : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Reservation total</span>
                <span className="font-medium">{reservationTotalLabel}</span>
              </div>

              {costSharing.requiresPayment ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Suggested split
                    </span>
                    <span className="font-medium">
                      Est. {suggestedSplitLabel}/player
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {costSharing.splitBasisPlayers} players (includes
                    host).
                  </p>

                  {costSharing.paymentInstructions ? (
                    <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                      {costSharing.paymentInstructions}
                    </div>
                  ) : null}

                  {costSharing.paymentLinkUrl ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={costSharing.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open payment link
                      </a>
                    </Button>
                  ) : null}

                  <p className="text-xs text-muted-foreground">
                    KudosCourts does not process payments. Pay the host directly
                    using the instructions above.
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No payment required.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Confirmed</span>
                <span className="font-medium">
                  {data.openPlay.confirmedCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Capacity</span>
                <span>{data.openPlay.maxPlayers} total</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    window.location.origin +
                      appRoutes.openPlay.detail(openPlayId),
                  );
                }}
              >
                Copy link
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Share this link to invite friends to join.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
