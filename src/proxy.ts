import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  appRoutes,
  isGuestRoute,
  isProtectedRoute,
} from "@/shared/lib/app-routes";
import { getSafeRedirectPath } from "@/shared/lib/redirects";

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
    return NextResponse.redirect(
      new URL(appRoutes.login.from(redirectPath), request.url),
    );
  }

  // Redirect authenticated users from guest routes
  if (user && isGuestRoute(path)) {
    const redirectTo = getSafeRedirectPath(
      request.nextUrl.searchParams.get("redirect"),
      {
        fallback: appRoutes.home.base,
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
