"use client";

import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { useQueryOwnerOrganization } from "@/features/owner/hooks";
import { OwnerNavbar } from "./owner-navbar";
import { OwnerSidebar } from "./owner-sidebar";
import { ReservationAlertsPanel } from "./reservation-alerts-panel";

interface OwnerShellProps {
  children: React.ReactNode;
  hasOrganizations: boolean;
}

export function OwnerShell({ children, hasOrganizations }: OwnerShellProps) {
  const pathname = usePathname();
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const { organization, organizations, isLoading } =
    useQueryOwnerOrganization();

  const noOrgMode = !hasOrganizations || (!isLoading && !organization?.id);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      pathname || appRoutes.owner.base,
    );
  };

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={organization ?? undefined}
          organizations={organizations}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          noOrgMode={noOrgMode}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={
            organization?.name ??
            (noOrgMode ? "Owner Setup" : "Owner Dashboard")
          }
          noOrgMode={noOrgMode}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      {children}
    </AppShell>
  );
}
