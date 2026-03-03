"use client";

import { usePathname } from "next/navigation";
import { AdminNavGroup } from "@/components/layout/nav-groups/admin-nav-group";
import { OrganizationNavGroup } from "@/components/layout/nav-groups/organization-nav-group";
import { PlayerNavGroup } from "@/components/layout/nav-groups/player-nav-group";
import { NavUser } from "@/components/layout/nav-user";
import {
  getCurrentPortal,
  PortalTabsSidebar,
} from "@/components/layout/portal-tabs-sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useQueryAdminSidebarStats } from "@/features/admin/hooks";
import { useQueryOwnerOrganization } from "@/features/owner/hooks";

export function DashboardSidebar() {
  const pathname = usePathname();
  const currentPortal = getCurrentPortal(pathname);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <PortalTabsSidebar />
      </SidebarHeader>

      <SidebarContent>
        {currentPortal === "player" && <PlayerNavGroup />}
        {currentPortal === "organization" && <OrganizationNavGroupWithData />}
        {currentPortal === "admin" && <AdminNavGroupWithData />}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

/** Wrapper that fetches org data for the organization nav group */
function OrganizationNavGroupWithData() {
  const { organization, isLoading } = useQueryOwnerOrganization();
  const noOrgMode = !isLoading && !organization?.id;

  return (
    <OrganizationNavGroup
      currentOrganization={organization ?? undefined}
      noOrgMode={noOrgMode}
    />
  );
}

/** Wrapper that fetches admin stats for badge counts */
function AdminNavGroupWithData() {
  const { data: stats } = useQueryAdminSidebarStats();

  return (
    <AdminNavGroup
      pendingClaimsCount={stats?.pendingClaims}
      pendingVerificationsCount={stats?.pendingVerifications}
    />
  );
}
