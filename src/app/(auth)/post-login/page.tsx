import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { makeOrganizationRepository } from "@/modules/organization/factories/organization.factory";
import { makeUserPreferenceService } from "@/modules/user-preference/factories/user-preference.factory";
import { requireSession } from "@/shared/infra/auth/server-session";
import { appRoutes } from "@/shared/lib/app-routes";
import { getSafeRedirectPath } from "@/shared/lib/redirects";

export const dynamic = "force-dynamic";

type PostLoginPageProps = {
  searchParams?: {
    redirect?: string | string[];
  };
};

const getRedirectParam = (
  redirectParam: string | string[] | undefined,
): string | undefined =>
  Array.isArray(redirectParam) ? redirectParam[0] : redirectParam;

export default async function PostLoginPage({
  searchParams,
}: PostLoginPageProps) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? appRoutes.postLogin.base;
  const session = await requireSession(pathname);

  const userPreferenceService = makeUserPreferenceService();
  const organizationRepository = makeOrganizationRepository();

  const [preference, organizations] = await Promise.all([
    userPreferenceService.findByUserId(session.userId),
    organizationRepository.findByOwnerId(session.userId),
  ]);

  const defaultPortal = preference?.defaultPortal ?? "player";
  const hasOrganization = organizations.length > 0;
  const fallbackRedirect =
    defaultPortal === "owner"
      ? hasOrganization
        ? appRoutes.owner.base
        : appRoutes.owner.getStarted
      : appRoutes.home.base;

  const redirectParam = getRedirectParam(searchParams?.redirect);
  const redirectPath = getSafeRedirectPath(redirectParam, {
    fallback: fallbackRedirect,
    disallowRoutes: ["guest"],
    disallowPathname: appRoutes.postLogin.base,
  });

  redirect(redirectPath);
}
