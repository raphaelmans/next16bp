"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";

type HomeNavbarAuthActionsVariant = "desktop" | "mobile";

const LazyHomeNavbarDesktopAuthActions = dynamic(
  () =>
    import("./home-navbar-auth-actions").then(
      (mod) => mod.HomeNavbarAuthActions,
    ),
  {
    ssr: false,
    loading: () => <HomeNavbarDesktopActionsFallback />,
  },
);

const LazyHomeNavbarMobileAuthActions = dynamic(
  () =>
    import("./home-navbar-auth-actions").then(
      (mod) => mod.HomeNavbarAuthActions,
    ),
  {
    ssr: false,
    loading: () => <HomeNavbarMobileActionsFallback />,
  },
);

export function HomeNavbarAuthActionsLoader({
  variant,
}: {
  variant: HomeNavbarAuthActionsVariant;
}) {
  if (variant === "desktop") {
    return <LazyHomeNavbarDesktopAuthActions variant={variant} />;
  }

  return <LazyHomeNavbarMobileAuthActions variant={variant} />;
}

function HomeNavbarDesktopActionsFallback() {
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

function HomeNavbarMobileActionsFallback() {
  return (
    <>
      <Button
        variant="ghost"
        asChild
        className="font-heading text-primary text-xs sm:text-sm"
      >
        <Link href={appRoutes.ownersGetStarted.base}>List Venue</Link>
      </Button>
      <Button
        variant="outline"
        asChild
        className="font-heading text-xs sm:text-sm"
      >
        <Link href={appRoutes.login.base}>Sign In</Link>
      </Button>
    </>
  );
}
