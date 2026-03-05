"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import {
  formatCurrency,
  formatDateShort,
  formatTime,
  formatTimeRange,
} from "@/common/format";
import { KudosStatusBadge, type ReservationStatus } from "@/components/kudos";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { BookingDetailsCard } from "@/features/reservation/components/booking-details-card";
import { CancelDialog } from "@/features/reservation/components/cancel-dialog";
import { ReservationActionsCard } from "@/features/reservation/components/reservation-actions-card";
import { ReservationExpired } from "@/features/reservation/components/reservation-expired";
import { StatusBanner } from "@/features/reservation/components/status-banner";
import {
  useModReservationInvalidation,
  useModReservationRealtimePlayerStream,
  useQueryReservationDetail,
  useQueryReservationLinkedDetail,
} from "@/features/reservation/hooks";

interface ReservationEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  triggeredByRole: "PLAYER" | "OWNER" | "SYSTEM";
  notes: string | null;
  createdAt: Date | string;
}

const RESERVATION_DETAIL_REFETCH_INTERVAL_MS = 15_000;

type ReservationDetailPageProps = {
  reservationId: string;
};

export default function ReservationDetailPage({
  reservationId,
}: ReservationDetailPageProps) {
  const id = reservationId;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { invalidateReservationDetail } = useModReservationInvalidation();

  const {
    data: reservationDetail,
    isLoading: isLoadingReservation,
    isFetching: isFetchingReservation,
  } = useQueryReservationDetail(id, RESERVATION_DETAIL_REFETCH_INTERVAL_MS);

  const { data: groupData } = useQueryReservationLinkedDetail(
    reservationId,
    RESERVATION_DETAIL_REFETCH_INTERVAL_MS,
  );
  const realtimeReservationIds = [
    id,
    ...(groupData?.items.map((item) => item.reservationId) ?? []),
  ];

  useModReservationRealtimePlayerStream({
    enabled: realtimeReservationIds.length > 0,
    reservationIds: realtimeReservationIds,
  });

  const reservation = reservationDetail?.reservation;
  const events: ReservationEvent[] = reservationDetail?.events ?? [];
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
      await invalidateReservationDetail({ reservationId: id });
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = isLoadingReservation;

  if (isLoading) {
    return (
      <Container className="py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner className="h-8 w-8 text-muted-foreground" />
        </div>
      </Container>
    );
  }

  if (!reservation || !courtRecord || !placeRecord) {
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
  const venueHref = appRoutes.places.detail(placeRecord.slug ?? placeRecord.id);
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

  const transformedTimeSlot = {
    id: reservation.id,
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    priceCents: reservation.totalPriceCents,
    currency: reservation.currency,
    createdAt: reservation.createdAt,
  };

  const isFreeSlot = transformedTimeSlot.priceCents === 0;

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

  const handleOpenChatFromBanner = () => {
    window.dispatchEvent(
      new CustomEvent("reservation-chat:open", {
        detail: {
          kind: "player",
          reservationId: reservation.id,
          source: "reservation-status-banner",
        },
      }),
    );
  };

  if (reservation.status === "EXPIRED") {
    return (
      <Container className="py-6">
        <ReservationExpired
          placeId={placeRecord.id}
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
        onMessageOwner={handleOpenChatFromBanner}
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-6 overflow-hidden">
        <div className="lg:col-span-2 space-y-6">
          <BookingDetailsCard
            court={court}
            timeSlot={transformedTimeSlot}
            venueHref={venueHref}
          />

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

          {groupData && (
            <Card>
              <CardHeader>
                <CardTitle>Group Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupData.items.map((item) => (
                  <div
                    key={item.reservationId}
                    className="rounded-lg border p-3 flex flex-wrap items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium">
                        <Link
                          href={appRoutes.places.detail(
                            item.place.slug ?? item.place.id,
                          )}
                          className="hover:underline"
                        >
                          {item.place.name} - {item.court.label}
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateShort(item.startTimeIso)} ·{" "}
                        {formatTimeRange(item.startTimeIso, item.endTimeIso)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <KudosStatusBadge
                        status={item.status as ReservationStatus}
                        size="sm"
                      />
                      <p className="font-medium">
                        {formatCurrency(item.totalPriceCents, item.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {groupData && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Items</span>
                  <span>{groupData.statusSummary.totalItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payable Items</span>
                  <span>{groupData.statusSummary.payableItems}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">
                    {formatCurrency(
                      groupData.reservationGroup.totalPriceCents,
                      groupData.reservationGroup.currency,
                    )}
                  </span>
                </div>
                {groupData.items.some(
                  (item) =>
                    item.totalPriceCents > 0 &&
                    item.status === "AWAITING_PAYMENT",
                ) && (
                  <div className="pt-2">
                    <Button asChild className="w-full">
                      <Link
                        href={appRoutes.reservations.payment(reservation.id)}
                      >
                        Complete Payment
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <ReservationActionsCard
            reservationId={reservation.id}
            status={reservation.status}
            reservationTotalPriceCents={reservation.totalPriceCents}
            reservationCurrency={reservation.currency}
            court={court}
            organization={organization}
            onCancel={() => setShowCancelDialog(true)}
            canCancel={canCancel}
            cancelDisabledReason={cancelDisabledReason}
            pingOwnerCount={reservation.pingOwnerCount ?? 0}
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
