"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Ellipsis,
  Heart,
  Home,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Settings,
  ShieldCheck,
  Tag,
  UploadCloud,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { getCurrentPortal } from "@/components/layout/portal-tabs-sidebar";
import { Badge } from "@/components/ui/badge";
import { useQueryAdminSidebarStats } from "@/features/admin/hooks/organization";
import {
  type MoreSheetSection,
  OwnerMoreSheet,
} from "@/features/owner/components/owner-more-sheet";
import { shouldShowOwnerGetStartedNav } from "@/features/owner/helpers";
import {
  useQueryOwnerSetupStatus,
  useQueryReservationCounts,
} from "@/features/owner/hooks";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";
import type { OrganizationMemberRole } from "@/lib/modules/organization-member/shared/permissions";
import { isOwnerRole } from "@/lib/modules/organization-member/shared/permissions";
import { cn } from "@/lib/utils";

interface TabConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  isMore?: boolean;
  showBadge?: boolean;
}

// ─── Player tabs ───────────────────────────────────────

const playerTabs: TabConfig[] = [
  { label: "Venues", href: appRoutes.courts.base, icon: MapPin },
  {
    label: "Reservations",
    href: appRoutes.reservations.base,
    icon: CalendarDays,
  },
  { label: "Home", href: appRoutes.home.base, icon: Home },
  { label: "Saved", href: appRoutes.savedVenues.base, icon: Heart },
];

// ─── Admin tabs ───────────────────────────────────────

const adminTabs: TabConfig[] = [
  { label: "Dashboard", href: appRoutes.admin.base, icon: LayoutDashboard },
  {
    label: "Claims",
    href: appRoutes.admin.claims.base,
    icon: Tag,
    showBadge: true,
  },
  {
    label: "Verify",
    href: appRoutes.admin.placeVerification.base,
    icon: ShieldCheck,
    showBadge: true,
  },
  { label: "Venues", href: appRoutes.admin.courts.base, icon: Building2 },
  { label: "Venues", href: appRoutes.admin.venues.base, icon: MapPin },
];

// ─── Organization tabs (role-based) ────────────────────

const MORE_TAB: TabConfig = {
  label: "More",
  href: "#",
  icon: Ellipsis,
  isMore: true,
};

function getOrgTabsForRole(role: OrganizationMemberRole): TabConfig[] {
  switch (role) {
    case "OWNER":
      return [
        {
          label: "Reservations",
          href: appRoutes.organization.reservations,
          icon: CalendarDays,
          showBadge: true,
        },
        {
          label: "Studio",
          href: appRoutes.organization.bookings,
          icon: CalendarRange,
        },
        {
          label: "Venues",
          href: appRoutes.organization.places.base,
          icon: MapPinned,
        },
        MORE_TAB,
      ];
    case "MANAGER":
      return [
        {
          label: "Reservations",
          href: appRoutes.organization.reservations,
          icon: CalendarDays,
          showBadge: true,
        },
        {
          label: "Studio",
          href: appRoutes.organization.bookings,
          icon: CalendarRange,
        },
        {
          label: "Venues",
          href: appRoutes.organization.places.base,
          icon: MapPinned,
        },
        MORE_TAB,
      ];
    case "VIEWER":
      return [
        {
          label: "Reservations",
          href: appRoutes.organization.reservations,
          icon: CalendarDays,
          showBadge: true,
        },
        {
          label: "Studio",
          href: appRoutes.organization.bookings,
          icon: CalendarRange,
        },
        {
          label: "Venues",
          href: appRoutes.organization.places.base,
          icon: MapPinned,
        },
      ];
  }
}

function getOrgMoreSectionsForRole(
  role: OrganizationMemberRole,
): MoreSheetSection[] {
  switch (role) {
    case "OWNER":
      return [
        {
          label: "Bookings",
          items: [
            {
              label: "Dashboard",
              href: appRoutes.organization.base,
              icon: LayoutDashboard,
            },
          ],
        },
        {
          label: "Organization",
          items: [
            { label: "Team", href: appRoutes.organization.team, icon: Users },
            {
              label: "Settings",
              href: appRoutes.organization.settings,
              icon: Settings,
            },
          ],
        },
        {
          label: "Data",
          items: [
            {
              label: "Imports",
              href: appRoutes.organization.imports.bookings,
              icon: UploadCloud,
            },
          ],
        },
      ];
    case "MANAGER":
      return [
        {
          label: "Bookings",
          items: [
            {
              label: "Dashboard",
              href: appRoutes.organization.base,
              icon: LayoutDashboard,
            },
          ],
        },
        {
          label: "Organization",
          items: [
            {
              label: "Settings",
              href: appRoutes.organization.settings,
              icon: Settings,
            },
            { label: "Team", href: appRoutes.organization.team, icon: Users },
          ],
        },
        {
          label: "Data",
          items: [
            {
              label: "Imports",
              href: appRoutes.organization.imports.bookings,
              icon: UploadCloud,
            },
          ],
        },
      ];
    case "VIEWER":
      return [];
  }
}

// ─── Component ─────────────────────────────────────────

interface DashboardBottomTabsProps {
  organizationId?: string | null;
}

export function DashboardBottomTabs({
  organizationId,
}: DashboardBottomTabsProps) {
  const pathname = usePathname();
  const currentPortal = getCurrentPortal(pathname);
  const [moreOpen, setMoreOpen] = useState(false);

  if (currentPortal === "admin") {
    return <AdminBottomTabs pathname={pathname} />;
  }

  if (currentPortal === "player") {
    return <BottomTabBar tabs={playerTabs} pathname={pathname} />;
  }

  // Organization portal
  return (
    <OrganizationBottomTabs
      organizationId={organizationId}
      pathname={pathname}
      moreOpen={moreOpen}
      onMoreOpenChange={setMoreOpen}
    />
  );
}

// ─── Organization bottom tabs (needs hooks) ────────────

function OrganizationBottomTabs({
  organizationId,
  pathname,
  moreOpen,
  onMoreOpenChange,
}: {
  organizationId?: string | null;
  pathname: string;
  moreOpen: boolean;
  onMoreOpenChange: (open: boolean) => void;
}) {
  const { permissionContext, isLoading: permissionContextLoading } =
    useModOwnerPermissionContext();
  const { data: reservationCounts } = useQueryReservationCounts(
    organizationId ?? null,
  );
  const { data: setupStatus, isLoading: setupStatusLoading } =
    useQueryOwnerSetupStatus();

  const noOrgMode = !organizationId;
  const role: OrganizationMemberRole | null =
    permissionContext?.role ?? (permissionContextLoading ? null : "VIEWER");
  const baseTabs = role ? getOrgTabsForRole(role) : [];

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
    (noOrgMode || (permissionContext ? isOwnerRole(permissionContext) : false));

  // When setup is incomplete, swap Reservations → Get Started in bottom bar
  const tabs = showGetStarted
    ? baseTabs.map((tab) =>
        tab.label === "Reservations"
          ? {
              label: "Get Started",
              href: appRoutes.organization.getStarted,
              icon: ClipboardList,
              showBadge: false,
            }
          : tab,
      )
    : baseTabs;

  const roleSections = role ? getOrgMoreSectionsForRole(role) : [];

  // When Get Started replaces Reservations, add Reservations to More sheet
  const moreSections: MoreSheetSection[] = [
    ...(showGetStarted
      ? [
          {
            items: [
              {
                label: "Reservations",
                href: appRoutes.organization.reservations,
                icon: CalendarDays,
              },
            ],
          },
        ]
      : []),
    ...roleSections,
  ];

  const isActive = (href: string) => {
    if (href === appRoutes.organization.base) {
      return pathname === appRoutes.organization.base;
    }
    return pathname.startsWith(href);
  };

  const isMoreActive = moreSections.some((section) =>
    section.items.some((item) => isActive(item.href)),
  );

  if (!role && permissionContextLoading) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 pb-[max(0px,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
        aria-label="Bottom navigation loading"
      >
        <div className="grid h-14 grid-cols-4 items-center gap-2 px-3">
          {["tab-1", "tab-2", "tab-3", "tab-4"].map((id) => (
            <div
              key={id}
              className="h-8 rounded-md bg-muted/80 animate-pulse"
            />
          ))}
        </div>
      </nav>
    );
  }

  if (noOrgMode) {
    return (
      <BottomTabBar
        tabs={[
          {
            label: "Get Started",
            href: appRoutes.organization.getStarted,
            icon: ClipboardList,
          },
        ]}
        pathname={pathname}
      />
    );
  }

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
                  onClick={() => onMoreOpenChange(true)}
                  className={cn(
                    "flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors",
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

      {moreSections.length > 0 && (
        <OwnerMoreSheet
          open={moreOpen}
          onOpenChange={onMoreOpenChange}
          sections={moreSections}
        />
      )}
    </>
  );
}

// ─── Admin bottom tabs (needs hooks) ─────────────────

function AdminBottomTabs({ pathname }: { pathname: string }) {
  const { data: stats } = useQueryAdminSidebarStats();

  const isActive = (href: string) => {
    if (href === appRoutes.admin.base) {
      return pathname === appRoutes.admin.base;
    }
    return pathname.startsWith(href);
  };

  const getBadgeCount = (href: string): number | undefined => {
    if (href === appRoutes.admin.claims.base) return stats.pendingClaims;
    if (href === appRoutes.admin.placeVerification.base)
      return stats.pendingVerifications;
    return undefined;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t bg-background/95 backdrop-blur-md pb-[max(0px,env(safe-area-inset-bottom))]"
      aria-label="Bottom navigation"
    >
      <div className="flex h-14 items-stretch">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          const badgeCount = tab.showBadge
            ? getBadgeCount(tab.href)
            : undefined;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors",
                active ? "text-primary font-semibold" : "text-muted-foreground",
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
  );
}

// ─── Shared tab bar renderer ───────────────────────────

function BottomTabBar({
  tabs,
  pathname,
}: {
  tabs: TabConfig[];
  pathname: string;
}) {
  const isActive = (href: string) => {
    if (href === appRoutes.home.base) {
      return pathname === appRoutes.home.base;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t bg-background/95 backdrop-blur-md pb-[max(0px,env(safe-area-inset-bottom))]"
      aria-label="Bottom navigation"
    >
      <div className="flex h-14 items-stretch">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors",
                active ? "text-primary font-semibold" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-heading leading-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
