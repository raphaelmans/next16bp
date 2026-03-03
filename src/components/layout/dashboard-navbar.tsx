"use client";

import {
  Bell,
  Building2,
  ChevronDown,
  Home,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { KudosLogo } from "@/components/kudos";
import type { Portal } from "@/components/layout/portal-switcher";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { cn } from "@/lib/utils";

const portalLabels: Record<Portal, string> = {
  player: "Player View",
  organization: "Organization View",
  admin: "Admin Dashboard",
};

const portalIcons: Record<Portal, typeof Home> = {
  player: Home,
  organization: Building2,
  admin: Shield,
};

interface DashboardNavbarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string | null;
  };
  availablePortals?: Portal[];
  notificationSettingsHref?: string;
  onLogout?: () => void;
}

export function DashboardNavbar({
  user,
  availablePortals = ["player"],
  notificationSettingsHref,
  onLogout,
}: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPortal = getCurrentPortal(pathname);
  const [portalSheetOpen, setPortalSheetOpen] = useState(false);

  const effectiveNotificationSettingsHref =
    notificationSettingsHref ??
    (currentPortal === "organization"
      ? `${appRoutes.organization.settings}${SETTINGS_SECTION_HASHES.browserNotifications}`
      : `${appRoutes.account.profile}${SETTINGS_SECTION_HASHES.browserNotifications}`);

  const switchPortal = (portal: Portal) => {
    if (portal === currentPortal) return;
    router.push(
      portal === "player"
        ? appRoutes.home.base
        : portal === "organization"
          ? appRoutes.organization.base
          : appRoutes.admin.base,
    );
    setPortalSheetOpen(false);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex flex-1 items-center justify-between">
      {/* Left side — Brand + portal label */}
      <div className="flex items-center gap-3">
        <Link
          href={appRoutes.postLogin.base}
          className="flex items-center gap-2 hover:opacity-80 md:hidden"
        >
          <KudosLogo size={28} variant="icon" />
        </Link>

        {/* Mobile: tappable portal label */}
        {availablePortals.length > 1 && (
          <button
            type="button"
            onClick={() => setPortalSheetOpen(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground md:hidden"
          >
            <ChevronDown className="size-3" />
            <span className="truncate max-w-[120px]">
              {portalLabels[currentPortal]}
            </span>
          </button>
        )}
      </div>

      {/* Right side — Notifications + User dropdown */}
      <div className="flex items-center gap-2">
        <NotificationBell
          portal={currentPortal}
          settingsHrefOverride={effectiveNotificationSettingsHref}
        />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 gap-2 px-2 font-heading"
              >
                <Avatar className="h-6 w-6">
                  {user.avatarUrl && (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.name || user.email}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-heading font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">
                  {user.name || user.email}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {user.name && (
                    <p className="text-sm font-heading font-medium leading-none">
                      {user.name}
                    </p>
                  )}
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
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
                onClick={onLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Mobile portal switch sheet */}
      <Sheet open={portalSheetOpen} onOpenChange={setPortalSheetOpen}>
        <SheetContent side="top" className="h-auto">
          <SheetHeader>
            <SheetTitle className="font-heading">Switch Portal</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 py-4">
            {availablePortals.map((portal) => {
              const Icon = portalIcons[portal];
              const isActive = portal === currentPortal;

              return (
                <button
                  key={portal}
                  type="button"
                  onClick={() => switchPortal(portal)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-heading transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{portalLabels[portal]}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
