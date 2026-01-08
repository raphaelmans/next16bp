"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/shared/components/layout";
import { StatusBanner } from "@/features/reservation/components/status-banner";
import { BookingDetailsCard } from "@/features/reservation/components/booking-details-card";
import { ReservationActionsCard } from "@/features/reservation/components/reservation-actions-card";
import { CancelDialog } from "@/features/reservation/components/cancel-dialog";
import Link from "next/link";
import { Loader2 } from "lucide-react";

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
      id: timeSlot?.courtId || "",
    }),
    enabled: !!timeSlot?.courtId,
  });

  const isLoading = isLoadingReservation || isLoadingSlot || isLoadingCourt;

  if (isLoading) {
    return (
      <Container className="py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Container>
    );
  }

  if (!reservation || !timeSlot || !courtData) {
    return (
      <Container className="py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reservation not found</h1>
          <Link
            href="/reservations"
            className="text-primary hover:underline mt-4 inline-block"
          >
            View all reservations
          </Link>
        </div>
      </Container>
    );
  }

  const court = {
    id: courtData.court.id,
    name: courtData.court.name,
    address: courtData.court.address,
    city: courtData.court.city,
    coverImageUrl: courtData.photos[0]?.url,
    latitude: courtData.court.latitude
      ? parseFloat(courtData.court.latitude)
      : undefined,
    longitude: courtData.court.longitude
      ? parseFloat(courtData.court.longitude)
      : undefined,
  };

  const organizationForDisplay = courtData.organization
    ? {
        id: courtData.organization.id,
        name: courtData.organization.name,
      }
    : undefined;

  const organization = {
    contactEmail: undefined,
    contactPhone: undefined,
  };

  const transformedTimeSlot = {
    id: timeSlot.id,
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
    priceCents: timeSlot.priceCents ?? 0,
    currency: timeSlot.currency ?? "PHP",
  };

  return (
    <Container className="py-6">
      <PageHeader
        title="Reservation Details"
        breadcrumbs={[
          { label: "My Reservations", href: "/reservations" },
          { label: "Details" },
        ]}
        backHref="/reservations"
      />

      <StatusBanner
        status={reservation.status as any}
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
            status={reservation.status as any}
            court={court}
            organization={organization}
            onCancel={() => setShowCancelDialog(true)}
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
