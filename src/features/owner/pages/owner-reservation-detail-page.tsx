"use client";

import { format } from "date-fns";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { formatCurrency } from "@/common/format";
import { toast } from "@/common/toast";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  OwnerNavbar,
  OwnerSidebar,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { ConfirmDialog } from "@/features/owner/components/confirm-dialog";
import { RejectModal } from "@/features/owner/components/reject-modal";
import {
  useModOwnerReservationRealtimeStream,
  useModOwnerReservations,
  useMutAcceptReservation,
  useMutConfirmReservation,
  useMutRejectReservation,
  useQueryOwnerOrganization,
  useQueryOwnerReservationHistory,
  useQueryReservationGroupDetail,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";

const stageConfig = {
  CREATED: {
    label: "Needs acceptance",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  AWAITING_PAYMENT: {
    label: "Awaiting payment",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  PAYMENT_MARKED_BY_USER: {
    label: "Payment marked",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
} as const;

const eventLabelMap: Record<string, string> = {
  CREATED: "Reservation Created",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_MARKED_BY_USER: "Payment Marked",
  CONFIRMED: "Confirmed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const roleLabelMap: Record<string, string> = {
  PLAYER: "Player",
  OWNER: "Owner",
  SYSTEM: "System",
};

type OwnerReservationDetailPageProps = {
  reservationId: string;
};

type ReservationGroupDetailItem = {
  id: string;
  status: string;
  courtName?: string | null;
  slotStartTime?: string | null;
  slotEndTime?: string | null;
  amountCents?: number | null;
  currency?: string | null;
};

export default function OwnerReservationDetailPage({
  reservationId,
}: OwnerReservationDetailPageProps) {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();

  const { data: reservations = [], isLoading } = useModOwnerReservations(
    organization?.id ?? null,
    { reservationId },
  );

  const { data: history = [], isLoading: historyLoading } =
    useQueryOwnerReservationHistory({ reservationId });

  const reservation = reservations[0];
  useModOwnerReservationRealtimeStream({
    enabled: Boolean(organization?.id && reservationId),
    reservationIds: [reservationId],
  });

  const reservationGroupQuery = useQueryReservationGroupDetail(
    reservation?.reservationGroupId ?? undefined,
  );
  const reservationGroupItems = React.useMemo(
    () =>
      (
        (
          reservationGroupQuery.data as
            | { reservations?: ReservationGroupDetailItem[] }
            | undefined
        )?.reservations ?? []
      ).filter((item) => item.id !== reservation?.id),
    [reservation?.id, reservationGroupQuery.data],
  );
  const acceptMutation = useMutAcceptReservation();
  const confirmMutation = useMutConfirmReservation();
  const rejectMutation = useMutRejectReservation();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectMode, setRejectMode] = React.useState<"reject" | "cancel">(
    "reject",
  );

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.reservationDetail(reservationId),
    );
  };

  const isCreated = reservation?.reservationStatus === "CREATED";
  const isAwaiting = reservation?.reservationStatus === "AWAITING_PAYMENT";
  const isMarked = reservation?.reservationStatus === "PAYMENT_MARKED_BY_USER";
  const confirmTitle = isCreated ? "Accept Reservation" : "Confirm Payment";
  const confirmLabel = isCreated ? "Accept" : "Confirm";

  const handleConfirmSubmit = () => {
    if (!reservation) return;
    const isCreatedReservation = reservation.reservationStatus === "CREATED";
    const mutation = isCreatedReservation ? acceptMutation : confirmMutation;
    const successMessage = isCreatedReservation
      ? "Reservation accepted"
      : "Payment confirmed";
    const errorMessage = isCreatedReservation
      ? "Failed to accept reservation"
      : "Failed to confirm payment";

    mutation.mutate(
      {
        reservationId: reservation.id,
        reservationGroupId: reservation.reservationGroupId,
      },
      {
        onSuccess: () => {
          toast.success(successMessage);
          setConfirmOpen(false);
        },
        onError: () => {
          toast.error(errorMessage);
        },
      },
    );
  };

  const handleRejectSubmit = (reason: string) => {
    if (!reservation) return;
    rejectMutation.mutate(
      {
        reservationId: reservation.id,
        reservationGroupId: reservation.reservationGroupId,
        reason,
      },
      {
        onSuccess: () => {
          toast.success(
            rejectMode === "cancel"
              ? "Reservation cancelled"
              : "Reservation rejected",
          );
          setRejectOpen(false);
        },
        onError: () => {
          toast.error("Failed to update reservation");
        },
      },
    );
  };

  if (orgLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "Loading..." }}
            organizations={[]}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName="Loading..."
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
        floatingPanel={<ReservationAlertsPanel organizationId={null} />}
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-9 w-48" />
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-36" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={organization ?? undefined}
          organizations={organizations ?? []}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? ""}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Reservation Details"
          description="Review reservation status and take action"
          breadcrumbs={[
            {
              label: "Reservations",
              href: appRoutes.organization.reservations,
            },
            { label: "Details" },
          ]}
        />

        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={appRoutes.organization.reservationsActive}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Active Reservations
          </Link>
        </Button>

        {isLoading && (
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-36" />
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !reservation && (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Reservation not found.
            </CardContent>
          </Card>
        )}

        {reservation && (
          <>
            <Card>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-heading font-semibold">
                    {reservation.playerName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {reservation.reservationGroupId ? (
                      <Badge variant="secondary" className="text-xs">
                        Group booking
                      </Badge>
                    ) : null}
                    <Badge
                      className={cn(
                        "text-xs",
                        stageConfig[reservation.reservationStatus]?.className,
                      )}
                    >
                      {stageConfig[reservation.reservationStatus]?.label ??
                        reservation.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {reservation.courtName} · {reservation.startTime} -{" "}
                  {reservation.endTime}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Player Email</p>
                    <p className="font-medium">{reservation.playerEmail}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Player Phone</p>
                    <p className="font-medium">{reservation.playerPhone}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      {formatCurrency(
                        reservation.amountCents,
                        reservation.currency,
                      )}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {reservation.createdAt
                        ? format(
                            new Date(reservation.createdAt),
                            "MMM d, h:mm a",
                          )
                        : "--"}
                    </p>
                  </div>
                  {reservation.expiresAt && (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-warning" />
                        {format(
                          new Date(reservation.expiresAt),
                          "MMM d, h:mm a",
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {(isCreated || isAwaiting || isMarked) && (
                  <div className="flex flex-wrap gap-2">
                    {isAwaiting ? (
                      <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setRejectMode("cancel");
                          setRejectOpen(true);
                        }}
                      >
                        Cancel Reservation
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => setConfirmOpen(true)}
                        >
                          {isCreated ? "Accept Reservation" : "Confirm Payment"}
                        </Button>
                        <Button
                          variant="outline"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setRejectMode("reject");
                            setRejectOpen(true);
                          }}
                        >
                          Reject Reservation
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {reservation.reservationGroupId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Grouped Reservation Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {reservationGroupQuery.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                  ) : reservationGroupItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No additional grouped items found.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {reservationGroupItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border p-3 flex flex-wrap items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium">
                              {item.courtName ?? "Court"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.slotStartTime
                                ? format(
                                    new Date(item.slotStartTime),
                                    "MMM d, h:mm a",
                                  )
                                : "--"}{" "}
                              -{" "}
                              {item.slotEndTime
                                ? format(new Date(item.slotEndTime), "h:mm a")
                                : "--"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(
                                item.amountCents ?? 0,
                                item.currency ?? "PHP",
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stageConfig[
                                item.status as keyof typeof stageConfig
                              ]?.label ?? item.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-4">
                    {[0, 1].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No activity recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.map((event, index) => {
                      const label =
                        eventLabelMap[event.toStatus] ?? event.toStatus;
                      const roleLabel =
                        roleLabelMap[event.triggeredByRole] ??
                        event.triggeredByRole;
                      const createdAt = event.createdAt
                        ? format(new Date(event.createdAt), "MMM d, h:mm a")
                        : "--";
                      return (
                        <div key={event.id ?? `${event.toStatus}-${index}`}>
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              {index < history.length - 1 && (
                                <div className="w-px flex-1 bg-border" />
                              )}
                            </div>
                            <div className="pb-4 space-y-1">
                              <p className="font-medium">{label}</p>
                              <p className="text-sm text-muted-foreground">
                                {createdAt}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Role: {roleLabel}
                              </p>
                              {event.notes && (
                                <p className="text-xs text-muted-foreground">
                                  {event.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmSubmit}
        isLoading={confirmMutation.isPending || acceptMutation.isPending}
        title={confirmTitle}
        confirmLabel={confirmLabel}
      />

      <RejectModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onReject={handleRejectSubmit}
        isLoading={rejectMutation.isPending}
        title={
          rejectMode === "cancel" ? "Cancel Reservation" : "Reject Reservation"
        }
        reasonLabel={
          rejectMode === "cancel" ? "Reason for cancellation" : undefined
        }
        submitLabel={
          rejectMode === "cancel" ? "Cancel Reservation" : "Reject Reservation"
        }
      />
    </AppShell>
  );
}
