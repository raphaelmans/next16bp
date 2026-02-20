"use client";

import { usePathname, useRouter } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import {
  PortalSwitcher as LayoutPortalSwitcher,
  type Portal,
} from "@/components/layout/portal-switcher";
import { useModPortalSwitcherData } from "@/features/auth/hooks";

type PortalSwitcherProps = {
  variant: "sidebar" | "menu-items";
  isOwner?: boolean;
  isAdmin?: boolean;
  ownerSetupRequired?: boolean;
  className?: string;
};

const portalRoutes: Record<Portal, string> = {
  player: appRoutes.home.base,
  owner: appRoutes.owner.base,
  admin: appRoutes.admin.base,
};

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
  ownerSetupRequired: ownerSetupRequiredOverride,
  className,
}: PortalSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPortal = getCurrentPortal(pathname);

  const shouldInferAdmin = isAdmin === undefined;
  const shouldInferOwner = isOwner === undefined;

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
      : !hasOwnerOrganization && userPreference?.defaultPortal === "owner");
  const canAccessOwner =
    (isOwner ?? hasOwnerOrganization) || ownerSetupRequired;
  const canAccessAdmin = isAdmin ?? sessionUser?.role === "admin";

  const portalOptions: Portal[] = [
    "player",
    ...(canAccessOwner ? (["owner"] as const) : []),
    ...(canAccessAdmin ? (["admin"] as const) : []),
  ];

  const switchPortal = (portal: Portal) => {
    if (portal === currentPortal) {
      return;
    }

    if (portal === "owner" && ownerSetupRequired) {
      router.push(appRoutes.owner.getStarted);
    } else {
      router.push(portalRoutes[portal]);
    }

    if (portal === "player" || portal === "owner") {
      setDefaultPortal(portal);
    }
  };

  return (
    <LayoutPortalSwitcher
      variant={variant}
      currentPortal={currentPortal}
      portalOptions={portalOptions}
      ownerSetupRequired={ownerSetupRequired}
      onSwitchPortal={switchPortal}
      className={className}
    />
  );
}
