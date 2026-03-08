"use client";

import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { getCurrentPortal } from "@/components/layout/portal-tabs-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth/hooks";
import { NotificationBell } from "@/features/notifications/components/notification-bell";

export function DashboardNavbarRightControls() {
  const pathname = usePathname();
  const currentPortal = getCurrentPortal(pathname);
  const { data: sessionUser, isLoading: sessionLoading } =
    useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();

  if (sessionLoading && !sessionUser) {
    return <DashboardNavbarRightControlsGuestFallback />;
  }

  if (!sessionUser) {
    return <DashboardNavbarRightControlsGuestFallback />;
  }

  const effectiveNotificationSettingsHref =
    currentPortal === "organization"
      ? `${appRoutes.organization.settings}${SETTINGS_SECTION_HASHES.browserNotifications}`
      : `${appRoutes.account.profile}${SETTINGS_SECTION_HASHES.browserNotifications}`;
  const displayName =
    sessionUser.name ||
    sessionUser.displayName ||
    sessionUser.email?.split("@")[0] ||
    "User";
  const initials = displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href =
      currentPortal === "player"
        ? appRoutes.index.base
        : appRoutes.login.from(pathname || appRoutes.organization.base);
  };

  return (
    <div className="flex items-center gap-2">
      <NotificationBell
        portal={currentPortal}
        settingsHrefOverride={effectiveNotificationSettingsHref}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 gap-2 px-2 font-heading"
          >
            <Avatar className="h-6 w-6">
              {(sessionUser.avatarUrl ?? sessionUser.image) && (
                <AvatarImage
                  src={sessionUser.avatarUrl ?? sessionUser.image}
                  alt={displayName}
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-heading font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline-block">
              {displayName}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-heading font-medium leading-none">
                {displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {sessionUser.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={appRoutes.account.profile} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={effectiveNotificationSettingsHref}
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
    </div>
  );
}

function DashboardNavbarRightControlsGuestFallback() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" asChild className="font-heading">
        <Link href={appRoutes.login.base}>Sign In</Link>
      </Button>
    </div>
  );
}
