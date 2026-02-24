import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { appRoutes, isGuestRoute, isProtectedRoute } from "@/common/app-routes";
import { getSafeRedirectPath } from "@/common/redirects";
import { logger } from "@/lib/shared/infra/logger";

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

  if (path === "/api/v1/openapi.json") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (path.startsWith("/api/v1/google-loc/")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (path.startsWith("/api/v1/")) {
    const url = request.nextUrl.clone();
    url.pathname = path.replace(/^\/api\/v1\//, "/api/mobile/v1/");
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  // /api/mobile/ routes are excluded from the proxy matcher (see config below).
  // They use Bearer-token auth and don't need Supabase session refresh.
  // Note: NextResponse.next() for these paths triggers a 404 in Next.js 16
  // proxy — a known Turbopack routing bug. Excluding them from the matcher
  // avoids the issue entirely.

  const isExactOrChild = (pathname: string, base: string) =>
    pathname === base || pathname.startsWith(`${base}/`);

  const swapBase = (pathname: string, fromBase: string, toBase: string) => {
    const suffix = pathname.slice(fromBase.length);
    return `${toBase}${suffix}`;
  };

  // Canonical redirects: keep legacy URLs working but send list views to
  // /courts and detail views to /venues.
  if (isExactOrChild(path, "/owner/places")) {
    const nextPath = swapBase(path, "/owner/places", "/owner/venues");
    const url = request.nextUrl.clone();
    url.pathname = nextPath;
    return NextResponse.redirect(url, 308);
  }

  if (path === appRoutes.places.base) {
    const url = request.nextUrl.clone();
    url.pathname = appRoutes.courts.base;
    return NextResponse.redirect(url, 308);
  }

  if (isExactOrChild(path, "/places")) {
    const nextPath = swapBase(path, "/places", "/venues");
    const url = request.nextUrl.clone();
    url.pathname = nextPath;
    return NextResponse.redirect(url, 308);
  }

  // Internal rewrites: serve the canonical /venues URLs using existing
  // filesystem routes under /places.
  const rewritePath = (() => {
    if (isExactOrChild(path, "/owner/venues")) {
      return swapBase(path, "/owner/venues", "/owner/places");
    }
    if (isExactOrChild(path, "/venues")) {
      return swapBase(path, "/venues", "/places");
    }
    return null;
  })();

  const makeResponse = () => {
    if (!rewritePath) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const url = request.nextUrl.clone();
    url.pathname = rewritePath;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  };

  let supabaseResponse = makeResponse();

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
        supabaseResponse = makeResponse();
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
    logger.warn(
      {
        scope: "proxy:auth_guard",
        event: "auth.guard.redirected_to_login",
        pathname: path,
        redirectPath,
        host: request.nextUrl.host,
        forwardedHost: request.headers.get("x-forwarded-host"),
      },
      "Unauthenticated request to protected route",
    );

    return NextResponse.redirect(
      new URL(appRoutes.login.from(redirectPath), request.url),
    );
  }

  // Redirect authenticated users from guest routes
  if (user && isGuestRoute(path)) {
    const redirectTo = getSafeRedirectPath(
      request.nextUrl.searchParams.get("redirect"),
      {
        fallback: appRoutes.postLogin.base,
        origin: request.nextUrl.origin,
        disallowRoutes: ["guest"],
        disallowPathname: path,
      },
    );
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/mobile/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
