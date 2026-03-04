import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appRoutes } from "@/common/app-routes";
import { getSafeRedirectPath } from "@/common/redirects";
import { getRequestOrigin } from "@/common/request-origin";
import { env } from "@/lib/env";
import { makeProfileService } from "@/modules/profile/factories/profile.factory";
import { UserRoleAlreadyExistsError } from "@/modules/user-role/errors/user-role.errors";
import { makeUserRoleService } from "@/modules/user-role/factories/user-role.factory";
import { createClient } from "@/shared/infra/supabase/create-client";

/**
 * Auth callback route handler for OAuth and magic link flows.
 * Exchanges authorization code for session.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = searchParams.get("code");
  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"), {
    fallback: appRoutes.postLogin.base,
    origin,
    disallowRoutes: ["guest"],
  });

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (data.user) {
        try {
          await makeUserRoleService().create({
            userId: data.user.id,
            role: "member",
          });
        } catch (roleError) {
          if (!(roleError instanceof UserRoleAlreadyExistsError)) {
            throw roleError;
          }
        }

        await makeProfileService().getOrCreateProfile(
          data.user.id,
          data.user.email,
        );
      }

      const baseUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? origin;
      return NextResponse.redirect(`${baseUrl}${redirectPath}`);
    }
  }

  // Redirect to index on error (as requested)
  return NextResponse.redirect(`${origin}${appRoutes.index.base}`);
}
