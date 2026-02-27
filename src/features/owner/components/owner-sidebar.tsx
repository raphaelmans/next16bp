"use client";

import {
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Settings,
  UploadCloud,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { PortalSwitcher } from "@/features/auth/components/portal-switcher";
import {
  filterVisibleNavItems,
  type PageAccessRule,
  ROLE_DISPLAY_LABELS,
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
  logoUrl?: string;
}

interface OwnerSidebarProps {
  organizations?: Organization[];
  currentOrganization?: Organization;
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  noOrgMode?: boolean;
}

const navItems = [
  {
    title: "Availability Studio",
    href: appRoutes.owner.bookings,
    icon: CalendarRange,
    accessRule: { type: "any-member" } as PageAccessRule,
  },
  {
    title: "Reservations",
    href: appRoutes.owner.reservations,
    icon: CalendarDays,
    accessRule: {
      type: "permission",
      permission: "reservation.read",
    } as PageAccessRule,
  },
  {
    title: "Imports",
    href: appRoutes.owner.imports.bookings,
    icon: UploadCloud,
    accessRule: {
      type: "permission",
      permission: "reservation.guest_booking",
    } as PageAccessRule,
  },
  {
    title: "Team",
    href: appRoutes.owner.team,
    icon: Users,
    accessRule: { type: "any-member" } as PageAccessRule,
  },
  {
    title: "Settings",
    href: appRoutes.owner.settings,
    icon: Settings,
    accessRule: { type: "owner-only" } as PageAccessRule,
  },
];

const venuesSkeletonKeys = ["venue-skeleton-1", "venue-skeleton-2"];

export function OwnerSidebar({
  organizations = [],
  currentOrganization,
  user,
  noOrgMode = false,
}: OwnerSidebarProps) {
  const pathname = usePathname();
  const { data: quickLinks = [], isLoading: quickLinksLoading } =
    useQueryOwnerSidebarQuickLinks(currentOrganization?.id);
  const { data: setupStatus, isLoading: setupStatusLoading } =
    useQueryOwnerSetupStatus();
  const { data: reservationCounts } = useQueryReservationCounts(
    currentOrganization?.id ?? null,
  );
  const { permissionContext } = useModOwnerPermissionContext();

  const hasOrganization = !noOrgMode && Boolean(currentOrganization?.id);
  const showVenuesLoading =
    !noOrgMode && (quickLinksLoading || !hasOrganization);
  const reservationsBadgeCount = noOrgMode
    ? undefined
    : reservationCounts.pending;

  // Get Started is only shown when setup is incomplete AND user is the owner
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
    (noOrgMode || !permissionContext || isOwnerRole(permissionContext));

  // Filter nav items based on the user's permissions
  const visibleNavItems = permissionContext
    ? filterVisibleNavItems(navItems, permissionContext)
    : navItems;

  // Role label for the org header (e.g. "Owner", "Manager", "Viewer")
  const roleLabel = permissionContext
    ? ROLE_DISPLAY_LABELS[permissionContext.role]
    : "Owner";

  const isActive = (href: string) => {
    if (href === appRoutes.owner.base) {
      return pathname === appRoutes.owner.base;
    }
    return pathname.startsWith(href);
  };

  const getCourtBasePath = (placeId: string, courtId: string) =>
    `${appRoutes.owner.places.courts.base(placeId)}/${courtId}`;

  const isCourtActive = (placeId: string, courtId: string) =>
    pathname.startsWith(getCourtBasePath(placeId, courtId));

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        {/* Organization switcher */}
        {noOrgMode ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-sidebar-accent"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-medium">
                    Venue Setup
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Complete onboarding
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <PortalSwitcher variant="menu-items" isOwner ownerSetupRequired />
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={appRoutes.owner.getStarted}>Go to setup hub</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : currentOrganization ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-sidebar-accent"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  {currentOrganization.logoUrl ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentOrganization.logoUrl} />
                      <AvatarFallback>
                        {currentOrganization.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-medium truncate">
                    {currentOrganization.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <PortalSwitcher variant="menu-items" isOwner />
              {organizations.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  {organizations.map((org) => (
                    <DropdownMenuItem key={org.id} asChild>
                      <Link
                        href={`${appRoutes.owner.base}?org=${org.id}`}
                        className="flex items-center gap-2"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                          <Building2 className="h-3 w-3" />
                        </div>
                        <span className="truncate">{org.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-medium">
                {noOrgMode ? "Venue Setup" : "Dashboard"}
              </p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarNavItem
                href={appRoutes.owner.base}
                title="Dashboard"
                icon={LayoutDashboard}
                isActive={isActive(appRoutes.owner.base)}
                activeClassName="bg-primary text-primary-foreground"
              />

              {shouldShowGetStarted && (
                <SidebarNavItem
                  href={appRoutes.owner.getStarted}
                  title="Get started"
                  icon={ClipboardList}
                  isActive={isActive(appRoutes.owner.getStarted)}
                  activeClassName="bg-primary text-primary-foreground"
                />
              )}

              {!noOrgMode && (
                <>
                  {/* Courts discovery (cross-portal link to /courts) */}
                  <SidebarNavItem
                    href={appRoutes.courts.base}
                    title="Courts"
                    icon={MapPin}
                    isActive={isActive(appRoutes.courts.base)}
                    activeClassName="bg-primary text-primary-foreground"
                  />

                  {/* Venues - collapsible with nested venues > courts */}
                  <Collapsible
                    defaultOpen={
                      pathname.startsWith(appRoutes.owner.places.base) ||
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
                          appRoutes.owner.places.base,
                        )}
                        className={`font-heading ${
                          pathname.startsWith(appRoutes.owner.places.base)
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                      >
                        <Link href={appRoutes.owner.places.base}>
                          <MapPin className="h-4 w-4" />
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
                          {/* Venue > Courts hierarchy */}
                          {showVenuesLoading
                            ? venuesSkeletonKeys.map((key) => (
                                <SidebarMenuSubItem key={key}>
                                  <SidebarMenuSkeleton />
                                </SidebarMenuSubItem>
                              ))
                            : quickLinks.map((place) => {
                                const isPlaceActive = place.courts.some(
                                  (court) => isCourtActive(place.id, court.id),
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
                                          className="font-heading"
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
                                              <SidebarMenuSubItem
                                                key={court.id}
                                              >
                                                <SidebarMenuSubButton
                                                  asChild
                                                  isActive={isCourtActive(
                                                    place.id,
                                                    court.id,
                                                  )}
                                                >
                                                  <Link
                                                    href={appRoutes.owner.places.courts.availability(
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

                  {/* Remaining nav items (filtered by permissions) */}
                  {visibleNavItems.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      href={item.href}
                      title={item.title}
                      icon={item.icon}
                      isActive={isActive(item.href)}
                      activeClassName="bg-primary text-primary-foreground"
                      badgeCount={
                        item.href === appRoutes.owner.reservations
                          ? reservationsBadgeCount
                          : undefined
                      }
                    />
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        {user && (
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>
                {user.name?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-medium truncate">
                {user.name || user.email}
              </p>
              {user.name && (
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
