"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  PORTAL_STORAGE_KEY,
  useQueryAuthUserPreference,
} from "@/features/auth/hooks";
import { useQueryOwnerOrganization } from "@/features/owner/hooks";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";
import { OwnerBottomTabs } from "./owner-bottom-tabs";
import { OwnerNavbar } from "./owner-navbar";
import { OwnerPortalBootLoader } from "./owner-portal-boot-loader";
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
  const { isLoading: permissionContextLoading } =
    useModOwnerPermissionContext();
  const [hasBootstrappedOrgAccess, setHasBootstrappedOrgAccess] =
    useState(false);
  const isAdmin = user?.role === "admin";
  const isOrganizationRoute = pathname.startsWith(appRoutes.organization.base);

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
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks Safari/Firefox support
    document.cookie =
      "kudos.portal-context=organization; path=/; max-age=31536000; samesite=lax";
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

  useEffect(() => {
    if (!isOrganizationRoute || !hasOrganizations) {
      return;
    }

    if (!permissionContextLoading) {
      setHasBootstrappedOrgAccess(true);
    }
  }, [hasOrganizations, isOrganizationRoute, permissionContextLoading]);

  const showPortalBootLoader =
    isOrganizationRoute &&
    hasOrganizations &&
    !hasBootstrappedOrgAccess &&
    permissionContextLoading;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      pathname || appRoutes.organization.base,
    );
  };

  if (showPortalBootLoader) {
    return <OwnerPortalBootLoader />;
  }

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
