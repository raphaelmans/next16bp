import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { ReservationList } from "@/features/reservation/components/reservation-list";
import { ReservationTabs } from "@/features/reservation/components/reservation-tabs";
import { ReservationListSkeleton } from "@/features/reservation/components/skeletons";
import { appRoutes } from "@/shared/lib/app-routes";

export const metadata = {
  title: "My Reservations",
  description: "View and manage your court reservations",
};

export default function MyReservationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reservations"
        description="View and manage your court bookings"
        backHref={appRoutes.home.base}
      />

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
