"use client";

import {
  Building2,
  LayoutDashboard,
  MapPin,
  Shield,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
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
  SidebarMenuButton,
  SidebarMenuItem,
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
    badge: false,
    badgeKey: "none" as const,
  },
  {
    title: "Claims",
    href: appRoutes.admin.claims.base,
    icon: Tag,
    badge: true,
    badgeKey: "claims" as const,
  },
  {
    title: "Verification",
    href: appRoutes.admin.placeVerification.base,
    icon: ShieldCheck,
    badge: true,
    badgeKey: "verifications" as const,
  },
  {
    title: "Courts",
    href: appRoutes.admin.courts.base,
    icon: Building2,
    badge: false,
    badgeKey: "none" as const,
  },
  {
    title: "Venues",
    href: appRoutes.admin.venues.base,
    icon: MapPin,
    badge: false,
    badgeKey: "none" as const,
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

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="font-heading font-semibold">Admin Panel</span>
            <p className="text-xs text-muted-foreground">KudosCourts</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    className={
                      isActive(item.href)
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : ""
                    }
                  >
                    <Link href={item.href} className="font-heading">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge &&
                        item.badgeKey === "claims" &&
                        pendingClaimsCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto bg-warning/10 text-warning border border-warning/20"
                          >
                            {pendingClaimsCount}
                          </Badge>
                        )}
                      {item.badge &&
                        item.badgeKey === "verifications" &&
                        pendingVerificationsCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto bg-warning/10 text-warning border border-warning/20"
                          >
                            {pendingVerificationsCount}
                          </Badge>
                        )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
