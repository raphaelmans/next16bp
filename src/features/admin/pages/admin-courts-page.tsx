import { Plus } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { AdminPageRefreshButton } from "../components/admin-page-refresh-button";
import { AdminPlacesList } from "../components/admin-places-list";

export function AdminCourtsPageView() {
  return (
    <AdminPlacesList
      title="All Venues"
      description="Manage all venues on the platform"
      defaultTypeFilter="all"
      entityLabel={{ singular: "Court" }}
      primaryActions={
        <>
          <AdminPageRefreshButton />
          <Button asChild>
            <Link href={appRoutes.admin.courts.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add Curated Venue
            </Link>
          </Button>
        </>
      }
    />
  );
}
