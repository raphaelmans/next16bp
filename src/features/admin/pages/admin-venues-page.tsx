import { AdminPageRefreshButton } from "../components/admin-page-refresh-button";
import { AdminPlacesList } from "../components/admin-places-list";

export function AdminVenuesPageView() {
  return (
    <AdminPlacesList
      title="Org Venues"
      description="Manage organization venues on the platform"
      defaultTypeFilter="reservable"
      lockTypeFilter
      entityLabel={{ singular: "Venue" }}
      primaryActions={<AdminPageRefreshButton />}
    />
  );
}
