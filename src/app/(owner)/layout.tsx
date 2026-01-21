import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OwnerOnboardingIntentClearer } from "@/features/owner/components/owner-onboarding-intent-clearer";
import { makeOrganizationService } from "@/modules/organization/factories/organization.factory";
import { requireSession } from "@/shared/infra/auth/server-session";
import { appRoutes } from "@/shared/lib/app-routes";

/**
 * Owner route group layout.
 * Provides auth protection and organization check.
 */
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

  if (organizations.length === 0) {
    redirect(appRoutes.owner.onboarding);
  }

  return (
    <>
      <OwnerOnboardingIntentClearer />
      {children}
    </>
  );
}
