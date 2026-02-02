import { appRoutes } from "@/common/app-routes";
import { AdminPageFrame, AdminPlacesList } from "@/features/admin";

export default function AdminVenuesPage() {
  return (
    <AdminPageFrame redirectPath={appRoutes.admin.venues.base}>
      <AdminPlacesList
        title="Venues"
        description="Manage all venues on the platform"
        defaultTypeFilter="reservable"
        lockTypeFilter
        entityLabel={{ singular: "Venue" }}
      />
    </AdminPageFrame>
  );
}
