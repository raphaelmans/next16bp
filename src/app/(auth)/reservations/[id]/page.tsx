"use client";

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KudosTimeline } from "@/shared/components/kudos";
import { useReservation } from "@/features/reservation/hooks/use-reservation";
import { StatusBanner } from "@/features/reservation/components/status-banner";
import { BookingDetailsCard } from "@/features/reservation/components/booking-details-card";
import { OrgInfoCard } from "@/features/reservation/components/org-info-card";
import { PaymentProofDisplay } from "@/features/reservation/components/payment-proof-display";
import { ReservationActionsCard } from "@/features/reservation/components/reservation-actions-card";
import { CancelDialog } from "@/features/reservation/components/cancel-dialog";
import { ReservationDetailSkeleton } from "@/features/reservation/components/skeletons";
import { ReservationNotFound } from "@/features/reservation/components/error-states";

export default function ReservationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: reservation, isLoading, isError } = useReservation(id);

  if (isLoading) {
    return <ReservationDetailSkeleton />;
  }

  if (isError || !reservation) {
    return <ReservationNotFound reservationId={id} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservation Details"
        breadcrumbs={[
          { label: "My Reservations", href: "/reservations" },
          { label: "Details" },
        ]}
        backHref="/reservations"
      />

      {/* Status banner */}
      <StatusBanner
        status={reservation.status}
        reservationId={reservation.id}
        expiresAt={reservation.expiresAt}
        cancellationReason={reservation.cancellationReason}
      />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking details */}
          <BookingDetailsCard
            court={reservation.court}
            timeSlot={reservation.timeSlot}
          />

          {/* Organization info */}
          <OrgInfoCard organization={reservation.organization} />

          {/* Payment proof (if exists) */}
          {reservation.paymentProof && (
            <PaymentProofDisplay paymentProof={reservation.paymentProof} />
          )}

          {/* Timeline */}
          {reservation.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <KudosTimeline items={reservation.timeline} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - actions sidebar */}
        <div>
          <ReservationActionsCard
            reservationId={reservation.id}
            status={reservation.status}
            court={reservation.court}
            organization={reservation.organization}
            onCancel={() => setShowCancelDialog(true)}
          />
        </div>
      </div>

      {/* Cancel dialog */}
      <CancelDialog
        reservationId={reservation.id}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      />
    </div>
  );
}
