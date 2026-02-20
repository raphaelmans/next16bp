import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { OwnerChatWidget } from "@/features/chat/components/chat-widget/owner-chat-widget";
import { OwnerOnboardingIntentClearer } from "@/features/owner/components/owner-onboarding-intent-clearer";
import { OwnerShell } from "@/features/owner/components/owner-shell";
import { makeOrganizationService } from "@/lib/modules/organization/factories/organization.factory";
import { requireSession } from "@/lib/shared/infra/auth/server-session";

/**
 * Owner route group layout.
 * Provides auth protection and organization check.
 */
export const metadata: Metadata = {
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
  const pathname = headerStore.get("x-pathname") ?? appRoutes.owner.base;

  const session = await requireSession(pathname);

  const organizationService = makeOrganizationService();
  const organizations = await organizationService.getMyOrganizations(
    session.userId,
  );

  const isOnboardingRoute =
    pathname === appRoutes.owner.getStarted ||
    pathname === appRoutes.owner.onboarding;
  const hasOrganizations = organizations.length > 0;

  if (!hasOrganizations && !isOnboardingRoute) {
    redirect(appRoutes.owner.getStarted);
  }

  return (
    <>
      <OwnerOnboardingIntentClearer />
      <OwnerChatWidget />
      <OwnerShell hasOrganizations={hasOrganizations}>{children}</OwnerShell>
    </>
  );
}
