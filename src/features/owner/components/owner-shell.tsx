"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  PORTAL_STORAGE_KEY,
  useQueryAuthUserPreference,
} from "@/features/auth/hooks";
import { useQueryOwnerOrganization } from "@/features/owner/hooks";
import { OwnerBottomTabs } from "./owner-bottom-tabs";
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
  const { data: userPreference } = useQueryAuthUserPreference(!!user);
  const isAdmin = user?.role === "admin";

  // Immediate seed while DB preference loads (fallback for first visit)
  useEffect(() => {
    try {
      const current = localStorage.getItem(PORTAL_STORAGE_KEY);
      if (current === "owner") {
        localStorage.setItem(PORTAL_STORAGE_KEY, "organization");
      } else if (!current) {
        localStorage.setItem(PORTAL_STORAGE_KEY, "organization");
      }
    } catch {}
  }, []);

  // Sync from DB preference (authoritative — overrides stale localStorage)
  useEffect(() => {
    if (userPreference?.defaultPortal) {
      try {
        localStorage.setItem(PORTAL_STORAGE_KEY, userPreference.defaultPortal);
      } catch {}
    }
  }, [userPreference?.defaultPortal]);
  const logoutMutation = useMutAuthLogout();
  const { organization, organizations, isLoading } =
    useQueryOwnerOrganization();

  const noOrgMode = !hasOrganizations || (!isLoading && !organization?.id);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      pathname || appRoutes.organization.base,
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
          isAdmin={isAdmin}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={
            organization?.name ?? (noOrgMode ? "Venue Setup" : "Dashboard")
          }
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
          isAdmin={isAdmin}
        />
      }
      bottomNav={<OwnerBottomTabs />}
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      {children}
    </AppShell>
  );
}
