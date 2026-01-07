"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tag, Building2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AdminSidebarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  pendingClaimsCount?: number;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Claims",
    href: "/admin/claims",
    icon: Tag,
    badge: true,
  },
  {
    title: "Courts",
    href: "/admin/courts",
    icon: Building2,
  },
];

export function AdminSidebar({
  user,
  pendingClaimsCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
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
            <span className="font-semibold font-heading">Admin Panel</span>
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
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && pendingClaimsCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-auto bg-amber-100 text-amber-800"
                        >
                          {pendingClaimsCount}
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
            <p className="text-sm font-medium truncate">
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
