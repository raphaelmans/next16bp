"use client";

import { PlayerNavbar as SharedPlayerNavbar } from "@/components/layout/player-navbar";
import {
  UserDropdown,
  type UserDropdownUser,
} from "@/features/discovery/components/user-dropdown";
import { NotificationBell } from "@/features/notifications/components/notification-bell";

interface AuthPlayerNavbarProps {
  user: UserDropdownUser;
  isAdmin: boolean;
  onLogout?: () => void;
}

export function AuthPlayerNavbar({
  user,
  isAdmin,
  onLogout,
}: AuthPlayerNavbarProps) {
  return (
    <SharedPlayerNavbar
      rightContent={
        <>
          <NotificationBell portal="player" />
          <UserDropdown user={user} isAdmin={isAdmin} onSignOut={onLogout} />
        </>
      }
    />
  );
}
