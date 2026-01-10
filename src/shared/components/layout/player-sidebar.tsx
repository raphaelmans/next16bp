"use client";

import {
  Building2,
  CalendarDays,
  Home,
  MapPin,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { KudosLogo } from "@/shared/components/kudos";

interface PlayerSidebarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string | null;
  };
  isOwner?: boolean;
  isAdmin?: boolean;
}

const playerNavItems = [
  { title: "Home", href: "/home", icon: Home },
  { title: "Courts", href: "/courts", icon: MapPin },
  { title: "Reservations", href: "/reservations", icon: CalendarDays },
  { title: "Profile", href: "/account/profile", icon: User },
];

export function PlayerSidebar({
  user,
  isOwner = false,
  isAdmin = false,
}: PlayerSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/home") {
      return pathname === "/home";
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
          <KudosLogo size={28} variant="icon" />
          <div className="flex flex-col">
            <span className="text-sm font-heading font-semibold text-foreground">
              Player View
            </span>
            <span className="text-xs text-muted-foreground">KudosCourts</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Player</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {playerNavItems.map((item) => (
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

        {(isOwner || isAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel>Dashboards</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isOwner && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith("/owner")}
                      className={
                        pathname.startsWith("/owner")
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : ""
                      }
                    >
                      <Link href="/owner" className="font-heading">
                        <Building2 className="h-4 w-4" />
                        <span>Owner Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith("/admin")}
                      className={
                        pathname.startsWith("/admin")
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : ""
                      }
                    >
                      <Link href="/admin" className="font-heading">
                        <Shield className="h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        {user && (
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl ?? undefined} />
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
