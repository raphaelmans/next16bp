import { appRoutes } from "@/common/app-routes";
import { AdminPageFrame } from "@/features/admin";
import { AdminCourtsPageView } from "@/features/admin/pages/admin-courts-page";

export default function AdminCourtsPage() {
  return (
    <AdminPageFrame redirectPath={appRoutes.admin.courts.base}>
      <AdminCourtsPageView />
    </AdminPageFrame>
  );
}
