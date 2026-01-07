import { Suspense } from "react";
import { ReservationTabs } from "@/features/reservation/components/reservation-tabs";
import { ReservationList } from "@/features/reservation/components/reservation-list";
import { ReservationListSkeleton } from "@/features/reservation/components/skeletons";

export const metadata = {
  title: "My Reservations",
  description: "View and manage your court reservations",
};

export default function MyReservationsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Reservations</h1>
        <p className="text-muted-foreground">
          View and manage your court bookings
        </p>
      </div>

      {/* Tabs */}
      <Suspense fallback={null}>
        <ReservationTabs />
      </Suspense>

      {/* Reservation list */}
      <Suspense fallback={<ReservationListSkeleton />}>
        <ReservationList />
      </Suspense>
    </div>
  );
}
