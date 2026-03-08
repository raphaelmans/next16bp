import { Suspense } from "react";
import { appRoutes } from "@/common/app-routes";
import { PageHeader } from "@/components/ui/page-header";
import { ReservationTabs } from "@/features/reservation/components/reservation-tabs";

export function ReservationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reservations"
        description="View and manage your venue bookings"
        backHref={appRoutes.home.base}
      />
      <Suspense fallback={null}>
        <ReservationTabs />
      </Suspense>
    </div>
  );
}
