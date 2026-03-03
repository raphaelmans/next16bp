"use client";

import { Bell, ChevronsUpDown, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { getCurrentPortal } from "@/components/layout/portal-tabs-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth/hooks";

export function NavUser() {
  const pathname = usePathname();
  const currentPortal = getCurrentPortal(pathname);
  const { isMobile } = useSidebar();
  const { data: sessionUser } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();

  if (!sessionUser) return null;

  const displayName =
    sessionUser.name || sessionUser.email?.split("@")[0] || "User";
  const email = sessionUser.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const notificationSettingsHref =
    currentPortal === "organization"
      ? `${appRoutes.organization.settings}${SETTINGS_SECTION_HASHES.browserNotifications}`
      : `${appRoutes.account.profile}${SETTINGS_SECTION_HASHES.browserNotifications}`;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href =
      currentPortal === "player"
        ? appRoutes.index.base
        : appRoutes.login.from(pathname || appRoutes.organization.base);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {sessionUser.avatarUrl && (
                  <AvatarImage src={sessionUser.avatarUrl} alt={displayName} />
                )}
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-heading font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-heading font-semibold">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {sessionUser.avatarUrl && (
                    <AvatarImage
                      src={sessionUser.avatarUrl}
                      alt={displayName}
                    />
                  )}
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-heading font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-heading font-semibold">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href={appRoutes.account.profile}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={notificationSettingsHref}
                  className="cursor-pointer"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notification Preferences</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
