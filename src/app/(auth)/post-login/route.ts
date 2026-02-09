import { type NextRequest, NextResponse } from "next/server";
import { appRoutes } from "@/common/app-routes";
import { getSafeRedirectPath } from "@/common/redirects";
import { makeOrganizationRepository } from "@/lib/modules/organization/factories/organization.factory";
import { makeUserPreferenceService } from "@/lib/modules/user-preference/factories/user-preference.factory";
import { getServerSession } from "@/lib/shared/infra/auth/server-session";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  const pathnameWithSearch = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!session) {
    return NextResponse.redirect(
      new URL(appRoutes.login.from(pathnameWithSearch), request.url),
    );
  }

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

  const redirectPath = getSafeRedirectPath(
    request.nextUrl.searchParams.get("redirect"),
    {
      fallback: fallbackRedirect,
      origin: request.nextUrl.origin,
      disallowRoutes: ["guest"],
      disallowPathname: appRoutes.postLogin.base,
    },
  );

  return NextResponse.redirect(new URL(redirectPath, request.url));
}
