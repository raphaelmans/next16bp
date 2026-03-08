import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { AppClientProviders } from "@/common/providers/app-client-providers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OwnerChatWidget } from "@/features/chat/components/chat-widget/owner-chat-widget";
import { OwnerOnboardingIntentClearer } from "@/features/owner/components/owner-onboarding-intent-clearer";
import { makeOrganizationService } from "@/lib/modules/organization/factories/organization.factory";
import { requireSession } from "@/lib/shared/infra/auth/server-session";

/**
 * Owner route group layout.
 * Provides auth protection and organization check.
 */
export const metadata: Metadata = {
  manifest: "/organization-manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? appRoutes.organization.base;

  const session = await requireSession(pathname);

  const organizationService = makeOrganizationService();
  const organizations = await organizationService.getMyOrganizations(
    session.userId,
  );

  const isOnboardingRoute =
    pathname === appRoutes.organization.getStarted ||
    pathname === appRoutes.organization.onboarding;
  const hasOrganizations = organizations.length > 0;

  if (!hasOrganizations && !isOnboardingRoute) {
    redirect(appRoutes.organization.getStarted);
  }

  return (
    <AppClientProviders>
      <OwnerOnboardingIntentClearer />
      <OwnerChatWidget />
      <DashboardShell hasOrganizations={hasOrganizations}>
        {children}
      </DashboardShell>
    </AppClientProviders>
  );
}
