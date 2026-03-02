"use client";

import {
  CalendarDays,
  ChevronDown,
  LogOut,
  Settings,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { KudosLogo } from "@/components/kudos";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryAuthSession } from "@/features/auth";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { canAccessPage } from "@/features/owner/helpers";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";

interface OwnerNavbarProps {
  organizationName?: string;
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  isAdmin?: boolean;
}

export function OwnerNavbar({
  organizationName,
  user,
  onLogout,
  isAdmin,
}: OwnerNavbarProps) {
  const { data: sessionUser } = useQueryAuthSession();
  const { permissionContext } = useModOwnerPermissionContext();
  const effectiveIsAdmin = isAdmin ?? sessionUser?.role === "admin";
  const canAccessOrganizationSettings = permissionContext
    ? canAccessPage(permissionContext, { type: "owner-or-manager" })
    : false;
  const notificationSettingsHref = canAccessOrganizationSettings
    ? `${appRoutes.organization.settings}${SETTINGS_SECTION_HASHES.browserNotifications}`
    : `${appRoutes.account.profile}${SETTINGS_SECTION_HASHES.browserNotifications}`;

  return (
    <div className="flex flex-1 items-center justify-between">
      {/* Left side - Logo and Organization name */}
      <div className="flex items-center gap-4">
        <Link
          href={appRoutes.postLogin.base}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <KudosLogo size={28} variant="icon" />
        </Link>
        {organizationName && (
          <span className="text-sm font-heading font-medium text-muted-foreground hidden sm:inline">
            {organizationName}
          </span>
        )}
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-2">
        {user && (
          <NotificationBell
            portal="organization"
            settingsHrefOverride={notificationSettingsHref}
          />
        )}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 gap-2 px-2 font-heading"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.name || user.email}
                  />
                  <AvatarFallback className="text-xs">
                    {user.name?.charAt(0).toUpperCase() ||
                      user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">
                  {user.name || user.email}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
              <DropdownMenuItem asChild>
                <Link href={appRoutes.reservations.base}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  My Reservations
                </Link>
              </DropdownMenuItem>
              {effectiveIsAdmin && (
                <DropdownMenuItem asChild>
                  <Link href={appRoutes.admin.base}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={appRoutes.account.profile}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              {canAccessOrganizationSettings ? (
                <DropdownMenuItem asChild>
                  <Link href={appRoutes.organization.settings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
