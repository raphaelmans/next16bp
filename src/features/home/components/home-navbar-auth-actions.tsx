"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import {
  useMutAuthLogout,
  useQueryAuthMyOrganizations,
  useQueryAuthSession,
  useQueryAuthUserPreference,
} from "@/features/auth/hooks";
import { UserDropdown } from "@/features/discovery/components/user-dropdown";

type HomeNavbarAuthActionsVariant = "desktop" | "mobile";

export function HomeNavbarAuthActions({
  variant,
}: {
  variant: HomeNavbarAuthActionsVariant;
}) {
  const { data: sessionUser, isLoading: sessionLoading } =
    useQueryAuthSession();
  const { mutate: logout, isPending: isSigningOut } = useMutAuthLogout();
  const { data: organizations } = useQueryAuthMyOrganizations(!!sessionUser);
  const { data: userPreference } = useQueryAuthUserPreference(!!sessionUser);

  if (sessionLoading && !sessionUser) {
    return variant === "desktop" ? (
      <DesktopGuestActions />
    ) : (
      <MobileGuestActions />
    );
  }

  if (!sessionUser) {
    return variant === "desktop" ? (
      <DesktopGuestActions />
    ) : (
      <MobileGuestActions />
    );
  }

  const displayName =
    sessionUser.name ||
    sessionUser.displayName ||
    sessionUser.email?.split("@")[0] ||
    "User";
  const user = {
    name: displayName,
    email: sessionUser.email || "",
    avatarUrl: sessionUser.avatarUrl ?? sessionUser.image ?? null,
  };
  const isOwner = (organizations?.length ?? 0) > 0;
  const isAdmin = sessionUser.role === "admin";
  const ownerSetupRequired = !isOwner;
  const canAccessOwner = isOwner || ownerSetupRequired;
  const ownerMenuHref = ownerSetupRequired
    ? appRoutes.organization.getStarted
    : appRoutes.organization.base;
  const ownerMenuLabel = ownerSetupRequired ? "Venue Setup" : "Venue Dashboard";
  const showOwnerFirstMenu =
    userPreference?.defaultPortal === "organization" && canAccessOwner;
  const listYourVenueHref = isOwner
    ? appRoutes.organization.places.new
    : appRoutes.organization.getStarted;

  const handleSignOut = () => {
    logout(undefined, {
      onSuccess: () => {
        window.location.href = appRoutes.index.base;
      },
    });
  };

  if (variant === "mobile") {
    return (
      <>
        <Button variant="ghost" asChild className="font-heading text-primary">
          <Link href={appRoutes.courts.base}>Browse</Link>
        </Button>
        <UserDropdown
          user={user}
          isAdmin={isAdmin}
          defaultPortal={userPreference?.defaultPortal}
          ownerMenuHref={showOwnerFirstMenu ? ownerMenuHref : undefined}
          ownerMenuLabel={ownerMenuLabel}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />
      </>
    );
  }

  return (
    <>
      <Button variant="ghost" asChild className="font-heading text-primary">
        <Link href={listYourVenueHref}>List Your Venue</Link>
      </Button>
      <UserDropdown
        user={user}
        isAdmin={isAdmin}
        defaultPortal={userPreference?.defaultPortal}
        ownerMenuHref={showOwnerFirstMenu ? ownerMenuHref : undefined}
        ownerMenuLabel={ownerMenuLabel}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
    </>
  );
}

function DesktopGuestActions() {
  return (
    <>
      <Button variant="ghost" asChild className="font-heading text-primary">
        <Link href={appRoutes.ownersGetStarted.base}>List Your Venue</Link>
      </Button>
      <Button variant="outline" asChild className="font-heading">
        <Link href={appRoutes.login.base}>Sign In</Link>
      </Button>
    </>
  );
}

function MobileGuestActions() {
  return (
    <>
      <Button variant="ghost" asChild className="font-heading text-primary">
        <Link href={appRoutes.courts.base}>Browse</Link>
      </Button>
      <Button variant="outline" asChild className="font-heading">
        <Link href={appRoutes.login.base}>Sign In</Link>
      </Button>
    </>
  );
}
