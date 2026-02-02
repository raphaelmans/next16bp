import { Plus } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { AdminPageFrame, AdminPlacesList } from "@/features/admin";

export default function AdminCourtsPage() {
  return (
    <AdminPageFrame redirectPath={appRoutes.admin.courts.base}>
      <AdminPlacesList
        title="All Courts"
        description="Manage all courts on the platform"
        defaultTypeFilter="all"
        entityLabel={{ singular: "Court" }}
        primaryActions={
          <>
            <Button variant="outline" asChild>
              <Link href={appRoutes.admin.courts.batch}>
                <Plus className="mr-2 h-4 w-4" />
                Batch Add Courts
              </Link>
            </Button>
            <Button asChild>
              <Link href={appRoutes.admin.courts.new}>
                <Plus className="mr-2 h-4 w-4" />
                Add Curated Court
              </Link>
            </Button>
          </>
        }
      />
    </AdminPageFrame>
  );
}
