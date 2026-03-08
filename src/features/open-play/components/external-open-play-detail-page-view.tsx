"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { formatInTimeZone, formatTimeRangeInTimeZone } from "@/common/format";
import { Container } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useQueryAuthSession } from "@/features/auth";
import {
  useMutCancelExternalOpenPlay,
  useMutCloseExternalOpenPlay,
  useMutDecideExternalOpenPlayParticipant,
  useMutLeaveExternalOpenPlay,
  useMutPromoteExternalOpenPlayToVerified,
  useMutReportExternalOpenPlay,
  useMutRequestJoinExternalOpenPlay,
  useQueryExternalOpenPlayDetail,
  useQueryExternalOpenPlayPublicDetail,
} from "../hooks";
import {
  OpenPlayDetailErrorState,
  OpenPlayDetailLoadingState,
  OpenPlayDetailNotFoundState,
  OpenPlayParticipantsCard,
  OpenPlayRequestsCard,
  OpenPlayShareCard,
} from "./open-play-detail-sections";

type ExternalOpenPlayDetailPageViewProps = {
  externalOpenPlayId: string;
};

export default function ExternalOpenPlayDetailPageView({
  externalOpenPlayId,
}: ExternalOpenPlayDetailPageViewProps) {
  const pathname = usePathname();
  const { data: session } = useQueryAuthSession();
  const isAuthed = Boolean(session);

  const publicQuery = useQueryExternalOpenPlayPublicDetail(
    externalOpenPlayId,
    !isAuthed && Boolean(externalOpenPlayId),
  );
  const detailQuery = useQueryExternalOpenPlayDetail(
    externalOpenPlayId,
    isAuthed && Boolean(externalOpenPlayId),
  );

  const data = detailQuery.data ?? publicQuery.data;
  const isLoading =
    (!isAuthed && publicQuery.isLoading) || (isAuthed && detailQuery.isLoading);
  const error = (isAuthed ? detailQuery.error : publicQuery.error) ?? null;

  const join = useMutRequestJoinExternalOpenPlay();
  const leave = useMutLeaveExternalOpenPlay();
  const decide = useMutDecideExternalOpenPlayParticipant();
  const close = useMutCloseExternalOpenPlay();
  const cancel = useMutCancelExternalOpenPlay();
  const report = useMutReportExternalOpenPlay();
  const promote = useMutPromoteExternalOpenPlayToVerified();

  const [joinDialogOpen, setJoinDialogOpen] = React.useState(false);
  const [joinMessage, setJoinMessage] = React.useState("");

  const [promoteDialogOpen, setPromoteDialogOpen] = React.useState(false);
  const [reservationId, setReservationId] = React.useState("");
  const [reservationGroupId, setReservationGroupId] = React.useState("");

  React.useEffect(() => {
    if (!joinDialogOpen) setJoinMessage("");
  }, [joinDialogOpen]);

  if (isLoading) return <OpenPlayDetailLoadingState />;
  if (error) return <OpenPlayDetailErrorState message={error.message} />;
  if (!data) return <OpenPlayDetailNotFoundState />;

  const detailData = detailQuery.data;
  const viewer = detailData?.viewer;
  const participants = detailData?.participants ?? null;

  const isHost = viewer?.role === "host";
  const myStatus = viewer?.myStatus ?? null;
  const hasStarted =
    Date.parse(data.externalOpenPlay.startsAtIso) <= Date.now();
  const isAutoJoin = data.externalOpenPlay.joinPolicy === "AUTO";
  const dateLabel = formatInTimeZone(
    data.externalOpenPlay.startsAtIso,
    data.place.timeZone,
    "EEE MMM d",
  );
  const timeLabel = formatTimeRangeInTimeZone(
    data.externalOpenPlay.startsAtIso,
    data.externalOpenPlay.endsAtIso,
    data.place.timeZone,
  );
  const courtSummary =
    data.externalOpenPlay.courtSummaryLabel ??
    (data.courts.length > 0
      ? data.courts.map((court) => court.label).join(", ")
      : "Court TBD");

  const joinDisabledReason =
    data.externalOpenPlay.status !== "ACTIVE"
      ? data.externalOpenPlay.status === "CLOSED"
        ? "This External Open Play is closed."
        : data.externalOpenPlay.status === "CANCELLED"
          ? "This External Open Play is cancelled."
          : "This External Open Play is not active."
      : hasStarted
        ? "This External Open Play has already started."
        : null;

  const canReport = isAuthed && data.externalOpenPlay.status === "ACTIVE";
  const canPromote =
    isHost &&
    data.externalOpenPlay.status === "ACTIVE" &&
    !data.externalOpenPlay.promotedOpenPlayId;
  const promotedOpenPlayId = data.externalOpenPlay.promotedOpenPlayId;

  return (
    <Container className="py-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="font-heading">
                    {data.externalOpenPlay.title || "External Open Play"}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.sport.name} • {courtSummary} • {data.place.name}
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
                  <Badge variant="outline">Unverified</Badge>
                  <Badge variant="secondary">
                    {data.externalOpenPlay.availableSpots === 0
                      ? "Full"
                      : `${data.externalOpenPlay.availableSpots} spots left`}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-warning/20 bg-warning/10 p-3 text-sm text-warning-foreground">
                This session was created from an external booking source (
                {data.externalOpenPlay.sourcePlatform === "RECLUB"
                  ? "Reclub"
                  : "Other"}
                ) and is not verified by the venue.
              </div>

              {data.externalOpenPlay.note ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  {data.externalOpenPlay.note}
                </div>
              ) : null}

              {data.courts.length > 0 ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="font-medium">Courts</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.courts.map((court, index) => (
                      <Badge
                        key={`${court.label}-${index}`}
                        variant="secondary"
                      >
                        {court.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {promotedOpenPlayId ? (
                <div className="rounded-md border bg-success/5 p-3 text-sm">
                  This session has been promoted to a verified Open Play.
                  <div className="mt-2">
                    <Button variant="outline" asChild size="sm">
                      <Link
                        href={appRoutes.openPlay.detail(promotedOpenPlayId)}
                      >
                        Open verified session
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}

              <Separator />

              {!isAuthed ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {isAutoJoin
                      ? "Sign in to join this external session."
                      : "Sign in to request to join this external session."}
                  </div>
                  <Button asChild>
                    <Link href={appRoutes.login.from(pathname)}>Sign in</Link>
                  </Button>
                </div>
              ) : isHost ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => close.mutate({ externalOpenPlayId })}
                    disabled={close.isPending || Boolean(joinDisabledReason)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => cancel.mutate({ externalOpenPlayId })}
                    disabled={cancel.isPending || Boolean(joinDisabledReason)}
                  >
                    Cancel
                  </Button>
                  {canPromote ? (
                    <Dialog
                      open={promoteDialogOpen}
                      onOpenChange={setPromoteDialogOpen}
                    >
                      <Button
                        variant="default"
                        onClick={() => setPromoteDialogOpen(true)}
                      >
                        Promote to verified
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Promote to verified Open Play
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <p className="text-sm text-muted-foreground">
                            Provide a reservation ID or reservation group ID
                            that matches this external session.
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="promoteReservationId">
                              Reservation ID
                            </Label>
                            <Input
                              id="promoteReservationId"
                              value={reservationId}
                              onChange={(e) => setReservationId(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="promoteReservationGroupId">
                              Reservation Group ID
                            </Label>
                            <Input
                              id="promoteReservationGroupId"
                              value={reservationGroupId}
                              onChange={(e) =>
                                setReservationGroupId(e.target.value)
                              }
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setPromoteDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              disabled={promote.isPending}
                              onClick={async () => {
                                const trimmedReservationId =
                                  reservationId.trim();
                                const trimmedReservationGroupId =
                                  reservationGroupId.trim();
                                if (
                                  !trimmedReservationId &&
                                  !trimmedReservationGroupId
                                ) {
                                  return;
                                }

                                try {
                                  const promoted = await promote.mutateAsync({
                                    externalOpenPlayId,
                                    reservationId:
                                      trimmedReservationId.length > 0
                                        ? trimmedReservationId
                                        : undefined,
                                    reservationGroupId:
                                      trimmedReservationGroupId.length > 0
                                        ? trimmedReservationGroupId
                                        : undefined,
                                  });
                                  setPromoteDialogOpen(false);
                                  window.location.href =
                                    appRoutes.openPlay.detail(
                                      promoted.openPlayId,
                                    );
                                } catch {
                                  // handled by hook
                                }
                              }}
                            >
                              Promote
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : null}
                </div>
              ) : myStatus ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    Status: <span className="font-medium">{myStatus}</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => leave.mutate({ externalOpenPlayId })}
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
                        ? "Join this external session."
                        : "Request to join this external session.")}
                  </div>
                  {isAutoJoin ? (
                    <Button
                      onClick={() => join.mutate({ externalOpenPlayId })}
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
                            <Label htmlFor="externalJoinMessage">
                              Message to host (optional)
                            </Label>
                            <Textarea
                              id="externalJoinMessage"
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
                                    externalOpenPlayId,
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

              {canReport ? (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={report.isPending}
                    onClick={() =>
                      report.mutate({
                        externalOpenPlayId,
                        reason: "FAKE_SLOT",
                      })
                    }
                  >
                    Report session
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {isHost && participants ? (
            <OpenPlayRequestsCard
              title="Requests"
              participants={participants.requested ?? []}
              emptyMessage="No requests yet."
              onRefresh={() => void detailQuery.refetch()}
              isRefreshing={detailQuery.isFetching}
              onConfirm={(externalParticipantId) =>
                decide.mutate({ externalParticipantId, decision: "CONFIRM" })
              }
              onWaitlist={(externalParticipantId) =>
                decide.mutate({ externalParticipantId, decision: "WAITLIST" })
              }
              onDecline={(externalParticipantId) =>
                decide.mutate({ externalParticipantId, decision: "DECLINE" })
              }
              decisionsDisabled={Boolean(joinDisabledReason)}
              isMutating={decide.isPending}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <OpenPlayParticipantsCard
            confirmedCount={data.externalOpenPlay.confirmedCount}
            maxPlayers={data.externalOpenPlay.maxPlayers}
          />

          <OpenPlayShareCard
            onCopyLink={async () => {
              await navigator.clipboard.writeText(
                window.location.origin +
                  appRoutes.openPlay.externalDetail(externalOpenPlayId),
              );
            }}
          />
        </div>
      </div>
    </Container>
  );
}
