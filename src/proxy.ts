import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { appRoutes, isGuestRoute, isProtectedRoute } from "@/common/app-routes";
import { getSafeRedirectPath } from "@/common/redirects";
import { getRequestOrigin } from "@/common/request-origin";

/**
 * Next.js proxy for session refresh and route protection.
 * - Refreshes Supabase session on every request
 * - Redirects unauthenticated users from protected routes to /login
 * - Redirects authenticated users from auth routes to /
 *
 * Note: In Next.js 16+, middleware is renamed to proxy.
 * The proxy runtime is nodejs-only (edge runtime not supported).
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const redirectPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", path);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase env vars are missing");
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANT: This refreshes the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users from protected routes
  if (!user && isProtectedRoute(path)) {
    const origin = getRequestOrigin(request);
    return NextResponse.redirect(
      new URL(appRoutes.login.from(redirectPath), origin),
    );
  }

  // Redirect authenticated users from guest routes
  if (user && isGuestRoute(path)) {
    const origin = getRequestOrigin(request);
    const redirectTo = getSafeRedirectPath(
      request.nextUrl.searchParams.get("redirect"),
      {
        fallback: appRoutes.postLogin.base,
        origin,
        disallowRoutes: ["guest"],
        disallowPathname: path,
      },
    );
    return NextResponse.redirect(new URL(redirectTo, origin));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
