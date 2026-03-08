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
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";

interface AdminNavGroupProps {
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
    title: "Venues",
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

export function AdminNavGroup({
  pendingClaimsCount = 0,
  pendingVerificationsCount = 0,
}: AdminNavGroupProps) {
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
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
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
              activeClassName="bg-primary text-primary-foreground"
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
  );
}
