"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
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
import { useTRPC } from "@/trpc/client";

interface ReservableDetail {
  requiresOwnerConfirmation?: boolean | null;
  paymentHoldMinutes?: number | null;
  ownerReviewMinutes?: number | null;
  cancellationCutoffMinutes?: number | null;
}

export default function ReservationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const trpc = useTRPC();

  const { data: reservation, isLoading: isLoadingReservation } = useQuery({
    ...trpc.reservation.getById.queryOptions({ reservationId: id }),
  });

  const { data: timeSlot, isLoading: isLoadingSlot } = useQuery({
    ...trpc.timeSlot.getById.queryOptions({
      slotId: reservation?.timeSlotId || "",
    }),
    enabled: !!reservation?.timeSlotId,
  });

  const { data: courtData, isLoading: isLoadingCourt } = useQuery({
    ...trpc.court.getById.queryOptions({
      courtId: timeSlot?.courtId || "",
    }),
    enabled: !!timeSlot?.courtId,
  });

  const { data: placeData, isLoading: isLoadingPlace } = useQuery({
    ...trpc.place.getById.queryOptions({
      placeId: courtData?.court.placeId || "",
    }),
    enabled: !!courtData?.court.placeId,
  });

  const { data: organizationData, isLoading: isLoadingOrganization } = useQuery(
    {
      ...trpc.organization.get.queryOptions({
        id: placeData?.place.organizationId || "",
      }),
      enabled: !!placeData?.place.organizationId,
    },
  );

  const isLoading =
    isLoadingReservation ||
    isLoadingSlot ||
    isLoadingCourt ||
    isLoadingPlace ||
    isLoadingOrganization;

  if (isLoading) {
    return (
      <Container className="py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  if (!reservation || !timeSlot || !courtData || !placeData) {
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

  const courtName = `${placeData.place.name} - ${courtData.court.label}`;
  const court = {
    id: courtData.court.id,
    name: courtName,
    address: placeData.place.address,
    city: placeData.place.city,
    coverImageUrl: placeData.photos[0]?.url,
    latitude: placeData.place.latitude
      ? Number.parseFloat(placeData.place.latitude)
      : undefined,
    longitude: placeData.place.longitude
      ? Number.parseFloat(placeData.place.longitude)
      : undefined,
  };

  const organizationForDisplay = organizationData
    ? {
        id: organizationData.organization.id,
        name: organizationData.organization.name,
      }
    : undefined;

  const reservableDetail =
    placeData.place.placeType === "RESERVABLE"
      ? (placeData.detail as ReservableDetail | null)
      : null;

  const organization = {
    contactEmail: organizationData?.profile?.contactEmail ?? undefined,
    contactPhone: organizationData?.profile?.contactPhone ?? undefined,
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
    reservableDetail?.cancellationCutoffMinutes ?? 0;
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
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="w-px flex-1 bg-border" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">Reservation Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(reservation.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {reservation.status === "PAYMENT_MARKED_BY_USER" && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="w-px flex-1 bg-border" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium">Payment Marked</p>
                      <p className="text-sm text-muted-foreground">
                        Awaiting owner confirmation
                      </p>
                    </div>
                  </div>
                )}
                {reservation.status === "CONFIRMED" &&
                  reservation.confirmedAt && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-success" />
                      </div>
                      <div>
                        <p className="font-medium">Confirmed</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(reservation.confirmedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
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
