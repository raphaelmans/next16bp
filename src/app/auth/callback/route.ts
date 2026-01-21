import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { UserRoleAlreadyExistsError } from "@/modules/user-role/errors/user-role.errors";
import { makeUserRoleService } from "@/modules/user-role/factories/user-role.factory";
import { createClient } from "@/shared/infra/supabase/create-client";
import { appRoutes } from "@/shared/lib/app-routes";
import { getSafeRedirectPath } from "@/shared/lib/redirects";

/**
 * Auth callback route handler for OAuth and magic link flows.
 * Exchanges authorization code for session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"), {
    fallback: appRoutes.home.base,
    origin,
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
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      }
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Redirect to index on error (as requested)
  return NextResponse.redirect(`${origin}${appRoutes.index.base}`);
}
