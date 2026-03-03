"use client";

import { Building2, ChevronsUpDown, Home, Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import type { Portal } from "@/components/layout/portal-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useModPortalSwitcherData } from "@/features/auth/hooks";
import { cn } from "@/lib/utils";

const portalConfig = {
  player: {
    label: "Player View",
    icon: Home,
    route: appRoutes.home.base,
  },
  organization: {
    label: "Organization View",
    icon: Building2,
    route: appRoutes.organization.base,
  },
  admin: {
    label: "Admin Dashboard",
    icon: Shield,
    route: appRoutes.admin.base,
  },
} as const;

const getCurrentPortal = (pathname: string): Portal => {
  if (pathname.startsWith(appRoutes.admin.base)) {
    return "admin";
  }
  if (pathname.startsWith(appRoutes.organization.base)) {
    return "organization";
  }
  // Portal-neutral routes: preserve the user's previous portal context via cookie
  if (pathname.startsWith(appRoutes.account.base)) {
    try {
      const match = document.cookie.match(
        /(?:^|;\s*)kudos\.portal-context=(\w+)/,
      );
      if (match?.[1] === "organization") return "organization";
      if (match?.[1] === "admin") return "admin";
    } catch {}
  }
  return "player";
};

interface PortalTabsSidebarProps {
  isOwner?: boolean;
  isAdmin?: boolean;
  ownerSetupRequired?: boolean;
}

export function PortalTabsSidebar({
  isOwner: isOwnerOverride,
  isAdmin: isAdminOverride,
  ownerSetupRequired: ownerSetupRequiredOverride,
}: PortalTabsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const currentPortal = getCurrentPortal(pathname);

  const shouldInferAdmin = isAdminOverride === undefined;
  const shouldInferOwner = isOwnerOverride === undefined;

  const { sessionUser, organizations, userPreference, setDefaultPortal } =
    useModPortalSwitcherData({
      inferAdmin: shouldInferAdmin,
      inferOwner: shouldInferOwner,
      onSetDefaultPortalError: (error) => {
        toast.error("Could not save default portal", {
          description: getClientErrorMessage(error, "Something went wrong"),
        });
      },
    });

  const hasOwnerOrganization = (organizations?.length ?? 0) > 0;
  const ownerSetupRequired =
    ownerSetupRequiredOverride ??
    (shouldInferOwner
      ? !hasOwnerOrganization
      : !hasOwnerOrganization &&
        userPreference?.defaultPortal === "organization");
  const canAccessOwner =
    (isOwnerOverride ?? hasOwnerOrganization) || ownerSetupRequired;
  const canAccessAdmin = isAdminOverride ?? sessionUser?.role === "admin";

  const availablePortals: Portal[] = [
    "player",
    ...(canAccessOwner ? (["organization"] as const) : []),
    ...(canAccessAdmin ? (["admin"] as const) : []),
  ];

  const switchPortal = (portal: Portal) => {
    if (portal === currentPortal) return;

    if (portal === "organization" && ownerSetupRequired) {
      router.push(appRoutes.organization.getStarted);
    } else {
      router.push(portalConfig[portal].route);
    }

    if (portal === "player" || portal === "organization") {
      setDefaultPortal(portal);
    }
  };

  const activeConfig = portalConfig[currentPortal];
  const ActiveIcon = activeConfig.icon;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={activeConfig.label}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ActiveIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-heading font-semibold">
                  {activeConfig.label}
                </span>
                <span className="truncate text-xs">KudosCourts</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Portals
            </DropdownMenuLabel>
            {availablePortals.map((portal) => {
              const config = portalConfig[portal];
              const Icon = config.icon;
              const isActive = portal === currentPortal;

              return (
                <DropdownMenuItem
                  key={portal}
                  onClick={() => switchPortal(portal)}
                  className={cn("gap-2 p-2", isActive && "bg-sidebar-accent")}
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Icon className="size-4 shrink-0" />
                  </div>
                  {config.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export { getCurrentPortal };
