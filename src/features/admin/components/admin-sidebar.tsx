"use client";

import {
  Building2,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { PortalSwitcher } from "@/components/layout/portal-switcher";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  pendingClaimsCount?: number;
  pendingVerificationsCount?: number;
}

const navItems = [
  {
    title: "Dashboard",
    href: appRoutes.admin.base,
    icon: LayoutDashboard,
    badgeKey: null,
  },
  {
    title: "Claims",
    href: appRoutes.admin.claims.base,
    icon: Tag,
    badgeKey: "claims" as const,
  },
  {
    title: "Verification",
    href: appRoutes.admin.placeVerification.base,
    icon: ShieldCheck,
    badgeKey: "verifications" as const,
  },
  {
    title: "Courts",
    href: appRoutes.admin.courts.base,
    icon: Building2,
    badgeKey: null,
  },
  {
    title: "Venues",
    href: appRoutes.admin.venues.base,
    icon: MapPin,
    badgeKey: null,
  },
] as const;

export function AdminSidebar({
  user,
  pendingClaimsCount = 0,
  pendingVerificationsCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === appRoutes.admin.base) {
      return pathname === appRoutes.admin.base;
    }
    return pathname.startsWith(href);
  };

  const getBadgeCount = (
    badgeKey: (typeof navItems)[number]["badgeKey"],
  ): number | undefined => {
    if (badgeKey === "claims") return pendingClaimsCount;
    if (badgeKey === "verifications") return pendingVerificationsCount;
    return undefined;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <PortalSwitcher variant="sidebar" isAdmin />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  icon={item.icon}
                  isActive={isActive(item.href)}
                  tooltip={item.title}
                  activeClassName="bg-primary/10 text-primary border-l-2 border-primary"
                  badgeCount={getBadgeCount(item.badgeKey)}
                  badgeClassName={
                    item.badgeKey
                      ? "bg-warning/10 text-warning border border-warning/20"
                      : undefined
                  }
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-medium truncate">
              {user?.name || "Admin User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || "admin@example.com"}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            Admin
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
