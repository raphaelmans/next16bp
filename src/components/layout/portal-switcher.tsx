"use client";

import { Building2, ChevronDown, Home, Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import { KudosLogo } from "@/components/kudos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/trpc/client";

type Portal = "player" | "owner" | "admin";

type PortalSwitcherProps = {
  variant: "sidebar" | "menu-items";
  isOwner?: boolean;
  isAdmin?: boolean;
  className?: string;
};

const portalConfig = {
  player: {
    label: "Player View",
    route: appRoutes.home.base,
    icon: Home,
  },
  owner: {
    label: "Owner View",
    route: appRoutes.owner.base,
    icon: Building2,
  },
  admin: {
    label: "Admin View",
    route: appRoutes.admin.base,
    icon: Shield,
  },
} as const;

const getCurrentPortal = (pathname: string): Portal => {
  if (pathname.startsWith(appRoutes.admin.base)) {
    return "admin";
  }

  if (pathname.startsWith(appRoutes.owner.base)) {
    return "owner";
  }

  return "player";
};

export function PortalSwitcher({
  variant,
  isOwner,
  isAdmin,
  className,
}: PortalSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPortal = getCurrentPortal(pathname);
  const shouldInferAdmin = isAdmin === undefined;
  const shouldInferOwner = isOwner === undefined;
  const { data: sessionUser } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    enabled: shouldInferAdmin || shouldInferOwner,
  });
  const { data: organizations } = trpc.organization.my.useQuery(undefined, {
    enabled: shouldInferOwner && !!sessionUser,
  });

  const canAccessOwner = isOwner ?? (organizations?.length ?? 0) > 0;
  const canAccessAdmin = isAdmin ?? sessionUser?.role === "admin";

  const setDefaultPortalMutation =
    trpc.userPreference.setDefaultPortal.useMutation({
      onError: (error) => {
        toast.error("Could not save default portal", {
          description: getClientErrorMessage(error, "Something went wrong"),
        });
      },
    });

  const portalOptions: Portal[] = [
    "player",
    ...(canAccessOwner ? (["owner"] as const) : []),
    ...(canAccessAdmin ? (["admin"] as const) : []),
  ];

  const switchPortal = (portal: Portal) => {
    if (portal === currentPortal) {
      return;
    }

    const targetRoute = portalConfig[portal].route;
    router.push(targetRoute);

    if (portal === "player" || portal === "owner") {
      setDefaultPortalMutation.mutate({
        defaultPortal: portal,
      });
    }
  };

  if (variant === "menu-items") {
    return (
      <>
        {portalOptions.map((portal) => {
          const option = portalConfig[portal];
          const Icon = option.icon;

          return (
            <DropdownMenuItem
              key={portal}
              onSelect={() => switchPortal(portal)}
              className={
                portal === currentPortal
                  ? "bg-accent text-accent-foreground [&_svg:not([class*='text-'])]:text-accent-foreground"
                  : ""
              }
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-sidebar-accent ${className ?? ""}`.trim()}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <KudosLogo size={18} variant="icon" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-semibold truncate">
              {portalConfig[currentPortal].label}
            </p>
            <p className="text-xs text-muted-foreground">KudosCourts</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {portalOptions.map((portal) => {
          const option = portalConfig[portal];
          const Icon = option.icon;

          return (
            <DropdownMenuItem
              key={portal}
              onSelect={() => switchPortal(portal)}
              className={
                portal === currentPortal
                  ? "bg-sidebar-accent text-sidebar-accent-foreground [&_svg:not([class*='text-'])]:text-sidebar-accent-foreground"
                  : ""
              }
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
