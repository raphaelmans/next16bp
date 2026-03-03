"use client";

import { CalendarDays, Home, MapPin, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";

const playerNavItems = [
  { title: "Home", href: appRoutes.home.base, icon: Home },
  { title: "Courts", href: appRoutes.courts.base, icon: MapPin },
  {
    title: "Reservations",
    href: appRoutes.reservations.base,
    icon: CalendarDays,
  },
  { title: "Profile", href: appRoutes.account.profile, icon: User },
];

export function PlayerNavGroup() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === appRoutes.home.base) {
      return pathname === appRoutes.home.base;
    }
    return pathname.startsWith(href);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Player</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {playerNavItems.map((item) => (
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
  );
}
