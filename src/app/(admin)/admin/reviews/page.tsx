import { appRoutes } from "@/common/app-routes";
import { AdminPageFrame, AdminReviewsList } from "@/features/admin";

export default function AdminReviewsPage() {
  return (
    <AdminPageFrame redirectPath={appRoutes.admin.reviews.base}>
      <AdminReviewsList />
    </AdminPageFrame>
  );
}
