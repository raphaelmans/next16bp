"use client";

import Link from "next/link";
import { UserDropdown } from "@/features/discovery/components/user-dropdown";
import { KudosLogo } from "@/shared/components/kudos";
import { appRoutes } from "@/shared/lib/app-routes";

interface PlayerNavbarProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  isOwner: boolean;
  isAdmin: boolean;
  onLogout?: () => void;
}

export function PlayerNavbar({
  user,
  isOwner,
  isAdmin,
  onLogout,
}: PlayerNavbarProps) {
  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href={appRoutes.home.base}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <KudosLogo size={28} variant="icon" />
          <span className="hidden sm:inline text-sm font-heading font-semibold">
            KudosCourts
          </span>
        </Link>
        <span className="hidden sm:inline text-xs text-muted-foreground">
          Player
        </span>
      </div>

      <div className="flex items-center gap-2">
        <UserDropdown
          user={user}
          isOwner={isOwner}
          isAdmin={isAdmin}
          onSignOut={onLogout}
        />
      </div>
    </div>
  );
}
