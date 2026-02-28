"use client";

import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Ellipsis,
  LayoutDashboard,
  LayoutGrid,
  MapPinned,
  Settings,
  UploadCloud,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { Badge } from "@/components/ui/badge";
import { shouldShowOwnerGetStartedNav } from "@/features/owner/helpers";
import {
  useQueryOwnerSetupStatus,
  useQueryReservationCounts,
} from "@/features/owner/hooks";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";
import type { OrganizationMemberRole } from "@/lib/modules/organization-member/shared/permissions";
import { isOwnerRole } from "@/lib/modules/organization-member/shared/permissions";
import { cn } from "@/lib/utils";
import { OwnerMoreSheet } from "./owner-more-sheet";

interface TabConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  /** When true, this tab opens the "More" sheet instead of navigating */
  isMore?: boolean;
  /** Show reservation badge count */
  showBadge?: boolean;
}

const MORE_TAB: TabConfig = {
  label: "More",
  href: "#",
  icon: Ellipsis,
  isMore: true,
};

function getTabsForRole(role: OrganizationMemberRole): TabConfig[] {
  switch (role) {
    case "OWNER":
      return [
        {
          label: "Reservations",
          href: appRoutes.owner.reservations,
          icon: CalendarDays,
          showBadge: true,
        },
        { label: "Courts", href: appRoutes.courts.base, icon: LayoutGrid },
        {
          label: "Venues",
          href: appRoutes.owner.places.base,
          icon: MapPinned,
        },
        MORE_TAB,
      ];
    case "MANAGER":
      return [
        {
          label: "Reservations",
          href: appRoutes.owner.reservations,
          icon: CalendarDays,
          showBadge: true,
        },
        { label: "Courts", href: appRoutes.courts.base, icon: LayoutGrid },
        {
          label: "Imports",
          href: appRoutes.owner.imports.bookings,
          icon: UploadCloud,
        },
        MORE_TAB,
      ];
    case "VIEWER":
      return [
        {
          label: "Reservations",
          href: appRoutes.owner.reservations,
          icon: CalendarDays,
          showBadge: true,
        },
        { label: "Courts", href: appRoutes.courts.base, icon: LayoutGrid },
        { label: "Profile", href: appRoutes.account.profile, icon: User },
      ];
  }
}

/** Tabs that live in the "More" sheet per role (everything NOT in the bottom bar). */
function getMoreItemsForRole(role: OrganizationMemberRole): TabConfig[] {
  switch (role) {
    case "OWNER":
      return [
        {
          label: "Dashboard",
          href: appRoutes.owner.base,
          icon: LayoutDashboard,
        },
        {
          label: "Availability Studio",
          href: appRoutes.owner.bookings,
          icon: CalendarRange,
        },
        {
          label: "Imports",
          href: appRoutes.owner.imports.bookings,
          icon: UploadCloud,
        },
        { label: "Team", href: appRoutes.owner.team, icon: Users },
        {
          label: "Settings",
          href: appRoutes.owner.settings,
          icon: Settings,
        },
      ];
    case "MANAGER":
      return [
        {
          label: "Dashboard",
          href: appRoutes.owner.base,
          icon: LayoutDashboard,
        },
        {
          label: "Availability Studio",
          href: appRoutes.owner.bookings,
          icon: CalendarRange,
        },
        {
          label: "Venues",
          href: appRoutes.owner.places.base,
          icon: MapPinned,
        },
        { label: "Team", href: appRoutes.owner.team, icon: Users },
      ];
    // VIEWER has no "More" tab
    case "VIEWER":
      return [];
  }
}

export function OwnerBottomTabs() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { permissionContext, organizationId } = useModOwnerPermissionContext();
  const { data: reservationCounts } = useQueryReservationCounts(organizationId);
  const { data: setupStatus, isLoading: setupStatusLoading } =
    useQueryOwnerSetupStatus();

  const noOrgMode = !organizationId;
  const role = permissionContext?.role ?? "OWNER";
  const tabs = getTabsForRole(role);

  const showGetStarted =
    shouldShowOwnerGetStartedNav({
      noOrgMode,
      setupStatusLoading,
      setupStatus: setupStatus
        ? {
            isSetupComplete: setupStatus.isSetupComplete,
            hasPaymentMethod: setupStatus.hasPaymentMethod,
            nextStep: setupStatus.nextStep,
          }
        : null,
    }) &&
    (noOrgMode || !permissionContext || isOwnerRole(permissionContext));

  const getStartedItem: TabConfig = {
    label: "Get Started",
    href: appRoutes.owner.getStarted,
    icon: ClipboardList,
  };

  const moreItems = [
    ...(showGetStarted ? [getStartedItem] : []),
    ...getMoreItemsForRole(role),
  ];

  const isActive = (href: string) => {
    if (href === appRoutes.owner.base) {
      return pathname === appRoutes.owner.base;
    }
    return pathname.startsWith(href);
  };

  const isMoreActive = moreItems.some((item) => isActive(item.href));

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t bg-background/95 backdrop-blur-md pb-[max(0px,env(safe-area-inset-bottom))]"
        aria-label="Bottom navigation"
      >
        <div className="flex h-14 items-stretch">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.isMore
              ? isMoreActive && moreOpen
              : isActive(tab.href);
            const badgeCount = tab.showBadge
              ? reservationCounts.pending
              : undefined;

            if (tab.isMore) {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors",
                    active
                      ? "text-primary font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-heading leading-tight">
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors",
                  active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {badgeCount != null && badgeCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 text-[10px] leading-none"
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </Badge>
                  )}
                </span>
                <span className="text-[10px] font-heading leading-tight">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {moreItems.length > 0 && (
        <OwnerMoreSheet
          open={moreOpen}
          onOpenChange={setMoreOpen}
          items={moreItems}
        />
      )}
    </>
  );
}
