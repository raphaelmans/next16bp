"use client";

import {
  Building2,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  MapPin,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { appRoutes } from "@/shared/lib/app-routes";
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

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
    title: "Dashboard",
    href: appRoutes.owner.base,
    icon: LayoutDashboard,
  },
  {
    title: "My Courts",
    href: appRoutes.owner.courts.base,
    icon: MapPin,
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

export function OwnerSidebar({
  organizations = [],
  currentOrganization,
  user,
}: OwnerSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === appRoutes.owner.base) {
      return pathname === appRoutes.owner.base;
    }
    return pathname.startsWith(href);
  };

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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className={
                      isActive(item.href)
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
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
