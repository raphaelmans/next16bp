"use client";

import { PlayerNavbar as SharedPlayerNavbar } from "@/components/layout/player-navbar";
import {
  UserDropdown,
  type UserDropdownUser,
} from "@/features/discovery/components/user-dropdown";
import { NotificationBell } from "@/features/notifications/components/notification-bell";

interface AuthPlayerNavbarProps {
  user: UserDropdownUser;
  isOwner: boolean;
  isAdmin: boolean;
  onLogout?: () => void;
}

export function AuthPlayerNavbar({
  user,
  isOwner,
  isAdmin,
  onLogout,
}: AuthPlayerNavbarProps) {
  return (
    <SharedPlayerNavbar
      rightContent={
        <>
          <NotificationBell portal="player" />
          <UserDropdown
            user={user}
            isOwner={isOwner}
            isAdmin={isAdmin}
            onSignOut={onLogout}
          />
        </>
      }
    />
  );
}
