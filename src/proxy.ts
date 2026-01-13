import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  appRoutes,
  isGuestRoute,
  isProtectedRoute,
} from "@/shared/lib/app-routes";

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

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase env vars are missing");
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
    return NextResponse.redirect(
      new URL(appRoutes.login.from(redirectPath), request.url),
    );
  }

  // Redirect authenticated users from guest routes
  if (user && isGuestRoute(path)) {
    const redirectTo =
      request.nextUrl.searchParams.get("redirect") ?? appRoutes.home.base;
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
