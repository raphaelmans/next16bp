import type { Metadata } from "next";
import { headers } from "next/headers";
import { appRoutes, getRouteType } from "@/common/app-routes";
import { OnboardingShell } from "@/components/layout/onboarding-shell";
import { PlayerShell } from "@/components/layout/player-shell";
import { PublicShell } from "@/components/layout/public-shell";
import {
  requireAdminSession,
  requireSession,
} from "@/lib/shared/infra/auth/server-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? appRoutes.index.base;
  const routeType = getRouteType(pathname);

  if (routeType === "guest") {
    return (
      <PublicShell>
        <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4 py-12">
          {children}
        </div>
      </PublicShell>
    );
  }

  if (routeType === "public") {
    return <PublicShell>{children}</PublicShell>;
  }

  if (routeType === "admin") {
    await requireAdminSession(pathname);
  } else {
    await requireSession(pathname);
  }

  if (pathname === "/owner/get-started") {
    return <OnboardingShell>{children}</OnboardingShell>;
  }

  return <PlayerShell>{children}</PlayerShell>;
}
