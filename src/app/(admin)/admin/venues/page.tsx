import { appRoutes } from "@/common/app-routes";
import { AdminPageFrame } from "@/features/admin";
import { AdminVenuesPageView } from "@/features/admin/pages/admin-venues-page";

export default function AdminVenuesPage() {
  return (
    <AdminPageFrame redirectPath={appRoutes.admin.venues.base}>
      <AdminVenuesPageView />
    </AdminPageFrame>
  );
}
