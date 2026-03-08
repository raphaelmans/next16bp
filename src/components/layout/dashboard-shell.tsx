"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardBottomTabs } from "@/components/layout/dashboard-bottom-tabs";
import { DashboardNavbar } from "@/components/layout/dashboard-navbar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import type { Portal } from "@/components/layout/portal-switcher";
import { getCurrentPortal } from "@/components/layout/portal-tabs-sidebar";
import { useQueryAuthSession } from "@/features/auth/hooks";
import { UnifiedChatInterface } from "@/features/chat/components/unified-chat/unified-chat-interface";
import { OwnerPortalBootLoader } from "@/features/owner/components/owner-portal-boot-loader";
import { ReservationAlertsPanel } from "@/features/owner/components/reservation-alerts-panel";
import { useQueryOwnerOrganization } from "@/features/owner/hooks";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";

interface DashboardShellProps {
  children: React.ReactNode;
  /** Whether the user has organizations (server-side check, owner layout only) */
  hasOrganizations?: boolean;
}

export function DashboardShell({
  children,
  hasOrganizations,
}: DashboardShellProps) {
  const pathname = usePathname();
  const currentPortal = getCurrentPortal(pathname);
  const { data: sessionUser } = useQueryAuthSession();
  const isAdmin = sessionUser?.role === "admin";

  // Keep the last non-admin portal available for portal-neutral routes.
  useEffect(() => {
    const isPortalNeutral = pathname.startsWith(appRoutes.account.base);
    if (currentPortal !== "admin" && !isPortalNeutral) {
      // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks Safari/Firefox support
      document.cookie = `kudos.portal-context=${currentPortal}; path=/; max-age=31536000; samesite=lax`;
    }
  }, [currentPortal, pathname]);

  // ─── Organization boot-loader gate ───────────────────
  if (currentPortal === "organization") {
    return (
      <OrganizationShellGate
        hasOrganizations={hasOrganizations}
        isAdmin={isAdmin}
      >
        {children}
      </OrganizationShellGate>
    );
  }

  // ─── Player or Admin portal ──────────────────────────
  const availablePortals: Portal[] = [
    "player",
    ...(hasOrganizations !== false ? (["organization"] as const) : []),
    ...(isAdmin ? (["admin"] as const) : []),
  ];

  return (
    <AppShell
      sidebar={<DashboardSidebar />}
      navbar={<DashboardNavbar availablePortals={availablePortals} />}
      bottomNav={<DashboardBottomTabs />}
      floatingPanel={
        currentPortal === "player" ? (
          <UnifiedChatInterface
            surface="floating"
            domain="reservation"
            reservationConfig={{
              kind: "player",
              storageKeys: {
                open: "player:chat:open",
                activeReservationThreadId:
                  "player:chat:activeReservationThreadId",
              },
              ui: {
                sheetTitle: "Messages",
                sheetDescription: "Reservation conversations",
              },
              labels: {
                listPrimary: (meta) => (meta ? meta.placeName : null),
                listSecondary: () => null,
                threadTitle: (meta) => meta?.placeName ?? "Messages",
              },
            }}
          />
        ) : undefined
      }
    >
      {children}
    </AppShell>
  );
}

// ─── Organization-specific shell with boot-loader ──────

function OrganizationShellGate({
  children,
  hasOrganizations,
  isAdmin,
}: {
  children: React.ReactNode;
  hasOrganizations?: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const { isLoading: permissionContextLoading } =
    useModOwnerPermissionContext();
  const { organization, isLoading } = useQueryOwnerOrganization();
  const [hasBootstrappedOrgAccess, setHasBootstrappedOrgAccess] =
    useState(false);

  const isOrganizationRoute = pathname.startsWith(appRoutes.organization.base);
  const _noOrgMode =
    hasOrganizations === false || (!isLoading && !organization?.id);

  useEffect(() => {
    if (!isOrganizationRoute || !hasOrganizations) return;
    if (!permissionContextLoading) {
      setHasBootstrappedOrgAccess(true);
    }
  }, [hasOrganizations, isOrganizationRoute, permissionContextLoading]);

  const showPortalBootLoader =
    isOrganizationRoute &&
    hasOrganizations !== false &&
    !hasBootstrappedOrgAccess &&
    permissionContextLoading;

  if (showPortalBootLoader) {
    return <OwnerPortalBootLoader />;
  }

  const availablePortals: Portal[] = [
    "player",
    "organization",
    ...(isAdmin ? (["admin"] as const) : []),
  ];

  return (
    <AppShell
      sidebar={<DashboardSidebar />}
      navbar={<DashboardNavbar availablePortals={availablePortals} />}
      bottomNav={
        <DashboardBottomTabs organizationId={organization?.id ?? null} />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      {children}
    </AppShell>
  );
}
