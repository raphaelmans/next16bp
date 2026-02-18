"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { KudosLogo } from "@/components/kudos";

interface PlayerNavbarProps {
  brandHref?: string;
  roleLabel?: string;
  rightContent?: React.ReactNode;
}

export function PlayerNavbar({
  brandHref = appRoutes.postLogin.base,
  roleLabel = "Player",
  rightContent,
}: PlayerNavbarProps) {
  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href={brandHref}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <KudosLogo size={28} variant="icon" />
          <span className="hidden sm:inline text-sm font-heading font-semibold">
            KudosCourts
          </span>
        </Link>
        <span className="hidden sm:inline text-xs text-muted-foreground">
          {roleLabel}
        </span>
      </div>

      <div className="flex items-center gap-2">{rightContent ?? null}</div>
    </div>
  );
}
