"use client";

import {
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  Settings,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { useOwnerSidebarQuickLinks } from "@/features/owner/hooks";
import { appRoutes } from "@/shared/lib/app-routes";

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
}

const navItems = [
  {
    title: "Imports",
    href: appRoutes.owner.imports.bookings,
    icon: UploadCloud,
  },
  {
    title: "Availability Studio",
    href: appRoutes.owner.bookings,
    icon: CalendarRange,
  },
  {
    title: "Reservations",
    href: appRoutes.owner.reservations,
    icon: CalendarDays,
  },
  {
    title: "Settings",
    href: appRoutes.owner.settings,
    icon: Settings,
  },
];

const venuesSkeletonKeys = ["venue-skeleton-1", "venue-skeleton-2"];

export function OwnerSidebar({
  organizations = [],
  currentOrganization,
  user,
}: OwnerSidebarProps) {
  const pathname = usePathname();
  const { data: quickLinks = [], isLoading: quickLinksLoading } =
    useOwnerSidebarQuickLinks(currentOrganization?.id);
  const hasOrganization = Boolean(currentOrganization?.id);
  const showVenuesLoading = quickLinksLoading || !hasOrganization;

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
        {currentOrganization ? (
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
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
                {organizations.length > 1 && (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </DropdownMenuTrigger>
            {organizations.length > 1 && (
              <DropdownMenuContent align="start" className="w-56">
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
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-medium">
                Owner Dashboard
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(appRoutes.owner.base)}
                  className={
                    isActive(appRoutes.owner.base)
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }
                >
                  <Link href={appRoutes.owner.base} className="font-heading">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

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
                    isActive={pathname.startsWith(appRoutes.owner.places.base)}
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
                                          <SidebarMenuSubItem key={court.id}>
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

              {/* Remaining nav items */}
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className={
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }
                  >
                    <Link href={item.href} className="font-heading">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
