"use client";

import {
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Settings,
  UploadCloud,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  filterVisibleNavItems,
  type PageAccessRule,
  shouldShowOwnerGetStartedNav,
} from "@/features/owner/helpers";
import {
  useQueryOwnerSetupStatus,
  useQueryOwnerSidebarQuickLinks,
  useQueryReservationCounts,
} from "@/features/owner/hooks";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";
import { isOwnerRole } from "@/lib/modules/organization-member/shared/permissions";

interface Organization {
  id: string;
  name: string;
}

interface OrganizationNavGroupProps {
  currentOrganization?: Organization;
  noOrgMode?: boolean;
}

const bookingsNavItems = [
  {
    title: "Availability Studio",
    href: appRoutes.organization.bookings,
    icon: CalendarRange,
    accessRule: { type: "any-member" } as PageAccessRule,
  },
  {
    title: "Reservations",
    href: appRoutes.organization.reservations,
    icon: CalendarDays,
    accessRule: {
      type: "permission",
      permission: "reservation.read",
    } as PageAccessRule,
  },
  {
    title: "Imports",
    href: appRoutes.organization.imports.bookings,
    icon: UploadCloud,
    accessRule: {
      type: "permission",
      permission: "reservation.guest_booking",
    } as PageAccessRule,
  },
];

const organizationNavItems = [
  {
    title: "Team",
    href: appRoutes.organization.team,
    icon: Users,
    accessRule: { type: "any-member" } as PageAccessRule,
  },
  {
    title: "Settings",
    href: appRoutes.organization.settings,
    icon: Settings,
    accessRule: { type: "owner-or-manager" } as PageAccessRule,
  },
];

const venuesSkeletonKeys = ["venue-skeleton-1", "venue-skeleton-2"];

export function OrganizationNavGroup({
  currentOrganization,
  noOrgMode = false,
}: OrganizationNavGroupProps) {
  const pathname = usePathname();
  const { data: quickLinks = [], isLoading: quickLinksLoading } =
    useQueryOwnerSidebarQuickLinks(currentOrganization?.id);
  const { data: setupStatus, isLoading: setupStatusLoading } =
    useQueryOwnerSetupStatus();
  const { data: reservationCounts } = useQueryReservationCounts(
    currentOrganization?.id ?? null,
  );
  const { permissionContext, isLoading: permissionContextLoading } =
    useModOwnerPermissionContext();

  const hasOrganization = !noOrgMode && Boolean(currentOrganization?.id);
  const showVenuesLoading =
    !noOrgMode && (quickLinksLoading || !hasOrganization);
  const reservationsBadgeCount = noOrgMode
    ? undefined
    : reservationCounts.pending;

  const shouldShowGetStarted =
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

  const visibleBookingsItems = permissionContext
    ? filterVisibleNavItems(bookingsNavItems, permissionContext)
    : permissionContextLoading
      ? []
      : bookingsNavItems.filter(
          (item) => item.accessRule.type === "any-member",
        );

  const visibleOrganizationItems = permissionContext
    ? filterVisibleNavItems(organizationNavItems, permissionContext)
    : permissionContextLoading
      ? []
      : organizationNavItems.filter(
          (item) => item.accessRule.type === "any-member",
        );

  const isActive = (href: string) => {
    if (href === appRoutes.organization.base) {
      return pathname === appRoutes.organization.base;
    }
    return pathname.startsWith(href);
  };

  const getCourtBasePath = (placeId: string, courtId: string) =>
    `${appRoutes.organization.places.courts.base(placeId)}/${courtId}`;

  const isCourtActive = (placeId: string, courtId: string) =>
    pathname.startsWith(getCourtBasePath(placeId, courtId));

  return (
    <>
      {/* Get started — standalone above groups */}
      {shouldShowGetStarted && (
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarNavItem
                href={appRoutes.organization.getStarted}
                title="Get started"
                icon={ClipboardList}
                isActive={isActive(appRoutes.organization.getStarted)}
                tooltip="Get started"
                activeClassName="bg-primary text-primary-foreground"
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Bookings group */}
      <SidebarGroup>
        <SidebarGroupLabel>Bookings</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarNavItem
              href={appRoutes.organization.base}
              title="Dashboard"
              icon={LayoutDashboard}
              isActive={isActive(appRoutes.organization.base)}
              tooltip="Dashboard"
              activeClassName="bg-primary text-primary-foreground"
            />
            {visibleBookingsItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                title={item.title}
                icon={item.icon}
                isActive={isActive(item.href)}
                tooltip={item.title}
                activeClassName="bg-primary text-primary-foreground"
                badgeCount={
                  item.href === appRoutes.organization.reservations
                    ? reservationsBadgeCount
                    : undefined
                }
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Properties group */}
      {!noOrgMode && (
        <SidebarGroup>
          <SidebarGroupLabel>Properties</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                defaultOpen={
                  pathname.startsWith(appRoutes.organization.places.base) ||
                  quickLinks.some((place) =>
                    place.courts.some((court) =>
                      isCourtActive(place.id, court.id),
                    ),
                  )
                }
                className="group/venues"
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(
                      appRoutes.organization.places.base,
                    )}
                    tooltip="Venues"
                    className={`font-normal ${
                      pathname.startsWith(appRoutes.organization.places.base)
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    <Link href={appRoutes.organization.places.base}>
                      <MapPinned className="h-4 w-4" />
                      <span>Venues</span>
                    </Link>
                  </SidebarMenuButton>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight className="h-4 w-4" />
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {showVenuesLoading
                        ? venuesSkeletonKeys.map((key) => (
                            <SidebarMenuSubItem key={key}>
                              <SidebarMenuSkeleton />
                            </SidebarMenuSubItem>
                          ))
                        : quickLinks.map((place) => {
                            const isPlaceActive = place.courts.some((court) =>
                              isCourtActive(place.id, court.id),
                            );

                            return (
                              <Collapsible
                                key={place.id}
                                defaultOpen={isPlaceActive}
                                className="group/place"
                              >
                                <SidebarMenuSubItem>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuSubButton
                                      isActive={isPlaceActive}
                                      className="font-normal"
                                    >
                                      <span>{place.name}</span>
                                      {place.courts.length > 0 && (
                                        <span className="ml-auto text-sidebar-foreground">
                                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/place:rotate-180" />
                                        </span>
                                      )}
                                    </SidebarMenuSubButton>
                                  </CollapsibleTrigger>
                                  {place.courts.length > 0 && (
                                    <CollapsibleContent>
                                      <SidebarMenuSub>
                                        {place.courts.map((court) => (
                                          <SidebarMenuSubItem key={court.id}>
                                            <SidebarMenuSubButton
                                              asChild
                                              isActive={isCourtActive(
                                                place.id,
                                                court.id,
                                              )}
                                            >
                                              <Link
                                                href={appRoutes.organization.places.courts.availability(
                                                  place.id,
                                                  court.id,
                                                )}
                                              >
                                                <span>{court.label}</span>
                                              </Link>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))}
                                      </SidebarMenuSub>
                                    </CollapsibleContent>
                                  )}
                                </SidebarMenuSubItem>
                              </Collapsible>
                            );
                          })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Organization group */}
      {!noOrgMode && visibleOrganizationItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleOrganizationItems.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                  isActive={isActive(item.href)}
                  tooltip={item.title}
                  activeClassName="bg-primary text-primary-foreground"
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
