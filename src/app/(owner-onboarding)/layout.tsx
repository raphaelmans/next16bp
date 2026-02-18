import type { Metadata } from "next";
import { headers } from "next/headers";
import { appRoutes } from "@/common/app-routes";
import { AuthOnboardingShell } from "@/features/auth/components/onboarding-shell";
import { requireSession } from "@/lib/shared/infra/auth/server-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OwnerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? appRoutes.owner.getStarted;

  await requireSession(pathname);

  return (
    <AuthOnboardingShell dashboardHref={appRoutes.owner.base}>
      {children}
    </AuthOnboardingShell>
  );
}
