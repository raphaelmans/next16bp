"use client";

import { Building2, ChevronDown, Home, Shield } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { KudosLogo } from "@/components/kudos";
import type { Portal } from "@/components/layout/portal-switcher";
import { getCurrentPortal } from "@/components/layout/portal-tabs-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const LazyDashboardNavbarRightControls = dynamic(
  () =>
    import("./dashboard-navbar-right-controls").then(
      (mod) => mod.DashboardNavbarRightControls,
    ),
  {
    ssr: false,
    loading: () => <DashboardNavbarRightControlsFallback />,
  },
);

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
  availablePortals?: Portal[];
}

export function DashboardNavbar({
  availablePortals = ["player"],
}: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPortal = getCurrentPortal(pathname);
  const [portalSheetOpen, setPortalSheetOpen] = useState(false);

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
      <LazyDashboardNavbarRightControls />

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

function DashboardNavbarRightControlsFallback() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" asChild className="font-heading">
        <Link href={appRoutes.login.base}>Sign In</Link>
      </Button>
    </div>
  );
}
