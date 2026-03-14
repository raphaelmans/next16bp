import type { Metadata } from "next";
import { headers } from "next/headers";
import { appRoutes } from "@/common/app-routes";
import { AppClientProviders } from "@/common/providers/app-client-providers";
import { CoachPortalShell } from "@/features/coach/components/coach-portal-shell";
import { requireSession } from "@/lib/shared/infra/auth/server-session";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? appRoutes.coach.base;

  await requireSession(pathname);

  return (
    <AppClientProviders>
      <CoachPortalShell>{children}</CoachPortalShell>
    </AppClientProviders>
  );
}
