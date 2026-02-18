"use client";

import { differenceInSeconds, format } from "date-fns";
import { Bell, Clock, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { DraggablePanel } from "@/components/ui/draggable-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/features/owner/components/confirm-dialog";
import { PlaceCourtFilter } from "@/features/owner/components/place-court-filter";
import { RejectModal } from "@/features/owner/components/reject-modal";
import {
  useModOwnerCourtFilter,
  useModOwnerPlaceFilter,
  useModReservationAlerts,
  useMutAcceptReservation,
  useMutConfirmReservation,
  useMutRejectReservation,
  useQueryOwnerCourts,
  useQueryOwnerOrganization,
  useQueryOwnerPlaces,
} from "@/features/owner/hooks";
import { cn } from "@/lib/utils";

export function ReservationAlertsPanel({
  organizationId,
  syncToUrl = false,
}: {
  organizationId?: string | null;
  syncToUrl?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [selectedReservationId, setSelectedReservationId] = React.useState<
    string | null
  >(null);
  const [rejectMode, setRejectMode] = React.useState<"reject" | "cancel">(
    "reject",
  );
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set());
  const lastPollRef = React.useRef<number | null>(null);

  const { organization } = useQueryOwnerOrganization();
  const { data: places = [] } = useQueryOwnerPlaces(organization?.id ?? null);
  const { data: courts = [] } = useQueryOwnerCourts(organization?.id ?? null);
  const { placeId, setPlaceId } = useModOwnerPlaceFilter({ syncToUrl });
  const { courtId, setCourtId } = useModOwnerCourtFilter({ syncToUrl });
  const effectiveOrganizationId = organizationId ?? organization?.id ?? null;

  const reservationsActiveHref = React.useMemo(() => {
    const params = new URLSearchParams();
    if (placeId) {
      params.set("placeId", placeId);
    }
    if (courtId) {
      params.set("courtId", courtId);
    }
    const suffix = params.toString();
    return suffix
      ? `${appRoutes.owner.reservationsActive}?${suffix}`
      : appRoutes.owner.reservationsActive;
  }, [courtId, placeId]);

  const alertsQuery = useModReservationAlerts(effectiveOrganizationId, {
    placeId: placeId || undefined,
    courtId: courtId || undefined,
  });
  const acceptMutation = useMutAcceptReservation();
  const confirmMutation = useMutConfirmReservation();
  const rejectMutation = useMutRejectReservation();

  const activeReservations = React.useMemo(() => {
    return (alertsQuery.data ?? []).filter(
      (reservation) =>
        reservation.reservationStatus === "CREATED" ||
        reservation.reservationStatus === "AWAITING_PAYMENT" ||
        reservation.reservationStatus === "PAYMENT_MARKED_BY_USER",
    );
  }, [alertsQuery.data]);

  const selectedReservation = React.useMemo(
    () =>
      activeReservations.find(
        (reservation) => reservation.id === selectedReservationId,
      ) ?? null,
    [activeReservations, selectedReservationId],
  );
  const confirmTitle =
    selectedReservation?.reservationStatus === "CREATED"
      ? "Accept Reservation"
      : "Confirm Payment";
  const confirmLabel =
    selectedReservation?.reservationStatus === "CREATED" ? "Accept" : "Confirm";

  React.useEffect(() => {
    if (!alertsQuery.dataUpdatedAt) return;
    if (lastPollRef.current) {
      const nextIds = activeReservations
        .filter((reservation) => {
          if (!reservation.createdAt) return false;
          const createdAt = new Date(reservation.createdAt).getTime();
          return createdAt > (lastPollRef.current ?? 0);
        })
        .map((reservation) => reservation.id);
      setNewIds(new Set(nextIds));
    }
    lastPollRef.current = alertsQuery.dataUpdatedAt;
  }, [alertsQuery.dataUpdatedAt, activeReservations]);

  const handleConfirm = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setConfirmOpen(true);
  };

  const handleReject = (reservationId: string, mode: "reject" | "cancel") => {
    setSelectedReservationId(reservationId);
    setRejectMode(mode);
    setRejectOpen(true);
  };

  const handleConfirmSubmit = () => {
    if (!selectedReservationId) return;
    const isCreated = selectedReservation?.reservationStatus === "CREATED";
    const mutation = isCreated ? acceptMutation : confirmMutation;
    const successMessage = isCreated
      ? "Reservation accepted"
      : "Payment confirmed";
    const errorMessage = isCreated
      ? "Failed to accept reservation"
      : "Failed to confirm payment";

    mutation.mutate(
      { reservationId: selectedReservationId },
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
    if (!selectedReservationId) return;
    rejectMutation.mutate(
      { reservationId: selectedReservationId, reason },
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

  if (!isOpen) {
    return (
      <Button
        size="icon"
        variant="secondary"
        className="fixed bottom-6 right-20 z-50 shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  const newCount = newIds.size;
  const lastUpdatedLabel = alertsQuery.dataUpdatedAt
    ? format(new Date(alertsQuery.dataUpdatedAt), "HH:mm:ss")
    : "--";

  return (
    <>
      <DraggablePanel
        storageKey="owner-reservation-alerts"
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-heading">
                Active Reservations
              </CardTitle>
              {newCount > 0 && (
                <Badge className="bg-accent/15 text-accent border border-accent/20">
                  {newCount} new
                </Badge>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated: {lastUpdatedLabel}</span>
            <Link
              href={reservationsActiveHref}
              className="flex items-center gap-1 text-accent hover:underline"
            >
              View all
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <PlaceCourtFilter
            compact
            places={places}
            courts={courts}
            placeId={placeId}
            courtId={courtId}
            onPlaceChange={(value) => setPlaceId(value === "all" ? "" : value)}
            onCourtChange={(value) => setCourtId(value === "all" ? "" : value)}
          />
        </div>

        {alertsQuery.isError && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            Failed to refresh alerts.
            <Button
              variant="link"
              className="px-1 text-destructive"
              onClick={() => alertsQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {!alertsQuery.isError && activeReservations.length === 0 && (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            No active reservations right now.
            <Link
              href={reservationsActiveHref}
              className="block mt-2 text-accent hover:underline"
            >
              Go to active reservations
            </Link>
          </div>
        )}

        {activeReservations.length > 0 && (
          <ScrollArea className="h-[280px] pr-2">
            <div className="space-y-3">
              {activeReservations.map((reservation) => {
                const isAwaiting =
                  reservation.reservationStatus === "AWAITING_PAYMENT";
                const stageLabel =
                  reservation.reservationStatus === "CREATED"
                    ? "Needs acceptance"
                    : reservation.reservationStatus === "AWAITING_PAYMENT"
                      ? "Awaiting payment"
                      : "Payment marked";
                const confirmLabel =
                  reservation.reservationStatus === "CREATED"
                    ? "Accept"
                    : "Confirm";
                const stageClassName = isAwaiting
                  ? "bg-warning/10 text-warning border border-warning/20"
                  : reservation.reservationStatus === "CREATED"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-primary/10 text-primary border border-primary/20";
                const expiresAt = reservation.expiresAt
                  ? new Date(reservation.expiresAt)
                  : null;
                const secondsRemaining = expiresAt
                  ? Math.max(0, differenceInSeconds(expiresAt, new Date()))
                  : null;
                const countdown =
                  secondsRemaining !== null
                    ? `${Math.floor(secondsRemaining / 60)}m ${
                        secondsRemaining % 60
                      }s`
                    : null;

                return (
                  <div
                    key={reservation.id}
                    className={cn(
                      "rounded-md border p-3 space-y-2",
                      newIds.has(reservation.id) &&
                        "border-accent/40 bg-accent/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-heading font-semibold">
                          {reservation.playerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reservation.courtName} · {reservation.startTime} -{" "}
                          {reservation.endTime}
                        </p>
                      </div>
                      <Badge className={cn("text-xs", stageClassName)}>
                        {stageLabel}
                      </Badge>
                    </div>

                    {isAwaiting && countdown && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{countdown} left</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-heading"
                        asChild
                      >
                        <Link
                          href={appRoutes.owner.reservationDetail(
                            reservation.id,
                          )}
                        >
                          View
                        </Link>
                      </Button>
                      {isAwaiting ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 font-heading"
                          onClick={() => handleReject(reservation.id, "cancel")}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10 font-heading"
                            onClick={() => handleConfirm(reservation.id)}
                          >
                            {confirmLabel}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 font-heading"
                            onClick={() =>
                              handleReject(reservation.id, "reject")
                            }
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DraggablePanel>

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
    </>
  );
}
