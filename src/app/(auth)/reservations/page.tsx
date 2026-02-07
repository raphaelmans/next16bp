import { Suspense } from "react";
import { appRoutes } from "@/common/app-routes";
import { PageHeader } from "@/components/ui/page-header";
import { ReservationTabs } from "@/features/reservation/components/reservation-tabs";

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
      {/* Tabs + list */}
      <Suspense fallback={null}>
        <ReservationTabs />
      </Suspense>
    </div>
  );
}
