"use client";

import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { BookingDetailsCard } from "@/features/reservation/components/booking-details-card";
import { CancelDialog } from "@/features/reservation/components/cancel-dialog";
import { ReservationActionsCard } from "@/features/reservation/components/reservation-actions-card";
import { ReservationExpired } from "@/features/reservation/components/reservation-expired";
import { StatusBanner } from "@/features/reservation/components/status-banner";
import { Container } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import {
  formatCurrency,
  formatDateShort,
  formatTime,
  formatTimeRange,
} from "@/shared/lib/format";
import { trpc } from "@/trpc/client";

interface ReservationEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  triggeredByRole: "PLAYER" | "OWNER" | "SYSTEM";
  notes: string | null;
  createdAt: Date | string;
}

export default function ReservationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const utils = trpc.useUtils();

  const {
    data: reservationDetail,
    isLoading: isLoadingReservation,
    isFetching: isFetchingReservation,
  } = trpc.reservation.getDetail.useQuery({ reservationId: id });

  const reservation = reservationDetail?.reservation;
  const events: ReservationEvent[] = reservationDetail?.events ?? [];
  const timeSlot = reservationDetail?.timeSlot;
  const courtRecord = reservationDetail?.court;
  const placeRecord = reservationDetail?.place;
  const placePhotos = reservationDetail?.placePhotos ?? [];
  const reservationPolicy = reservationDetail?.reservationPolicy ?? null;
  const organizationRecord = reservationDetail?.organization ?? null;
  const organizationProfile = reservationDetail?.organizationProfile ?? null;

  const handleRefresh = async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await utils.reservation.getDetail.invalidate({ reservationId: id });
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = isLoadingReservation;

  if (isLoading) {
    return (
      <Container className="py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  if (!reservation || !timeSlot || !courtRecord || !placeRecord) {
    return (
      <Container className="py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reservation not found</h1>
          <Link
            href={appRoutes.reservations.base}
            className="text-primary hover:underline mt-4 inline-block"
          >
            View all reservations
          </Link>
        </div>
      </Container>
    );
  }

  const courtName = `${placeRecord.name} - ${courtRecord.label}`;
  const court = {
    id: courtRecord.id,
    name: courtName,
    address: placeRecord.address,
    city: placeRecord.city,
    coverImageUrl: placePhotos[0]?.url,
    latitude: placeRecord.latitude
      ? Number.parseFloat(placeRecord.latitude)
      : undefined,
    longitude: placeRecord.longitude
      ? Number.parseFloat(placeRecord.longitude)
      : undefined,
  };

  const organizationForDisplay = organizationRecord
    ? {
        id: organizationRecord.id,
        name: organizationRecord.name,
      }
    : undefined;

  const effectiveReservationPolicy =
    placeRecord.placeType === "RESERVABLE" ? reservationPolicy : null;

  const organization = {
    contactEmail: organizationProfile?.contactEmail ?? undefined,
    contactPhone: organizationProfile?.contactPhone ?? undefined,
  };

  const effectivePriceCents = timeSlot.priceCents ?? 0;
  const effectiveCurrency = timeSlot.currency ?? "PHP";
  const isFreeSlot = timeSlot.isFree || effectivePriceCents === 0;

  const transformedTimeSlot = {
    id: timeSlot.id,
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    priceCents: effectivePriceCents,
    currency: effectiveCurrency,
  };

  const cancellationCutoffMinutes =
    effectiveReservationPolicy?.cancellationCutoffMinutes ?? 0;
  const cancellationCutoffTime = new Date(transformedTimeSlot.startTime);
  cancellationCutoffTime.setMinutes(
    cancellationCutoffTime.getMinutes() - cancellationCutoffMinutes,
  );
  const isCutoffPassed = Date.now() > cancellationCutoffTime.getTime();
  const isTerminalStatus =
    reservation.status === "EXPIRED" || reservation.status === "CANCELLED";
  const canCancel = !isTerminalStatus && !isCutoffPassed;
  const cancelDisabledReason = isTerminalStatus
    ? "This reservation is already closed."
    : isCutoffPassed
      ? `Cancellation window closed at ${formatTime(
          cancellationCutoffTime,
        )} on ${formatDateShort(cancellationCutoffTime)}.`
      : undefined;

  const slotDate = formatDateShort(transformedTimeSlot.startTime);
  const slotTime = formatTimeRange(
    transformedTimeSlot.startTime,
    transformedTimeSlot.endTime,
  );
  const amount = isFreeSlot
    ? "Free"
    : formatCurrency(
        transformedTimeSlot.priceCents,
        transformedTimeSlot.currency,
      );

  const activityLabels: Record<string, string> = {
    CREATED: "Reservation requested",
    AWAITING_PAYMENT: "Owner accepted (awaiting payment)",
    PAYMENT_MARKED_BY_USER: "Payment marked",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
  };

  const activityNotes: Record<string, string> = {
    CREATED: "Owner review in progress.",
    AWAITING_PAYMENT: "Complete payment before the deadline.",
    PAYMENT_MARKED_BY_USER: "Awaiting owner confirmation.",
  };

  const formatEventTimestamp = (timestamp: Date | string) =>
    `${formatDateShort(timestamp)} · ${formatTime(timestamp)}`;

  if (reservation.status === "EXPIRED") {
    return (
      <Container className="py-6">
        <ReservationExpired
          courtId={court.id}
          courtName={court.name}
          slotDate={slotDate}
          slotTime={slotTime}
          amount={amount}
        />
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <PageHeader
        title="Reservation Details"
        breadcrumbs={[
          { label: "My Reservations", href: appRoutes.reservations.base },
          { label: "Details" },
        ]}
        backHref={appRoutes.reservations.base}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isFetchingReservation}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isRefreshing || isFetchingReservation ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        }
      />

      <StatusBanner
        status={reservation.status}
        reservationId={reservation.id}
        expiresAt={reservation.expiresAt ?? undefined}
        cancellationReason={reservation.cancellationReason ?? undefined}
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <BookingDetailsCard court={court} timeSlot={transformedTimeSlot} />

          {organizationForDisplay && (
            <Card>
              <CardHeader>
                <CardTitle>Court Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{organizationForDisplay.name}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {events.map((event, index) => {
                    const isLast = index === events.length - 1;
                    const label =
                      activityLabels[event.toStatus] ??
                      `Status updated to ${event.toStatus}`;
                    const note = event.notes ?? activityNotes[event.toStatus];
                    const dotClassName =
                      event.toStatus === "CONFIRMED"
                        ? "bg-success"
                        : event.toStatus === "CANCELLED" ||
                            event.toStatus === "EXPIRED"
                          ? "bg-destructive"
                          : "bg-primary";

                    return (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-2 w-2 rounded-full ${dotClassName}`}
                          />
                          {!isLast && <div className="w-px flex-1 bg-border" />}
                        </div>
                        <div className={isLast ? "" : "pb-4"}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{label}</p>
                            <span className="text-xs uppercase text-muted-foreground">
                              {event.triggeredByRole}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatEventTimestamp(event.createdAt)}
                          </p>
                          {note && (
                            <p className="text-sm text-muted-foreground">
                              {note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <ReservationActionsCard
            reservationId={reservation.id}
            status={reservation.status}
            court={court}
            organization={organization}
            onCancel={() => setShowCancelDialog(true)}
            canCancel={canCancel}
            cancelDisabledReason={cancelDisabledReason}
          />
        </div>
      </div>

      <CancelDialog
        reservationId={reservation.id}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />
    </Container>
  );
}
