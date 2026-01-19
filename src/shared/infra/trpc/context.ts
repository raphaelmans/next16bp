import type { CookieMethodsServer } from "@supabase/ssr";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { cookies, headers } from "next/headers";
import { env } from "@/lib/env";
import { makeUserRoleRepository } from "@/modules/user-role/factories/user-role.factory";
import { createRequestLogger } from "@/shared/infra/logger";
import { createClient } from "@/shared/infra/supabase/create-client";
import type { Session } from "@/shared/kernel/auth";

export interface Context {
  requestId: string;
  session: Session | null;
  userId: string | null;
  cookies: CookieMethodsServer;
  origin: string;
  log: ReturnType<typeof createRequestLogger>;
}

export interface AuthenticatedContext extends Context {
  session: Session;
  userId: string;
}

/**
 * Creates the tRPC context for each request.
 * Extracts session from Supabase and enriches with role from database.
 */
export async function createContext({
  req,
}: FetchCreateContextFnOptions): Promise<Context> {
  const requestId =
    req.headers.get("x-request-id") ?? globalThis.crypto.randomUUID();
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Server Component - ignore
        }
      });
    },
  };

  // Get current user from Supabase
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    cookieMethods,
  );
  let session: Session | null = null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Fetch role from user_roles table
      const userRole = await makeUserRoleRepository().findByUserId(user.id);
      session = {
        userId: user.id,
        email: user.email ?? "",

        // =================================================================
        // DEBUG: To test different roles, change the role value below:
        //   "admin"  - Full admin access to /admin/* routes
        //   "member" - Default player/owner access
        //   "viewer" - Read-only access
        // Example: role: "admin",
        // =================================================================
        role: (userRole?.role as Session["role"]) ?? "member",
      };
    }
  } catch {
    // No session
  }

  const log = createRequestLogger({
    requestId,
    userId: session?.userId,
    method: req.method,
    path: new URL(req.url).pathname,
  });

  // Determine the origin URL for redirects
  const getOriginUrl = (): string => {
    const forwardedHost = headerStore.get("x-forwarded-host");
    const forwardedProto = headerStore.get("x-forwarded-proto");
    const host = headerStore.get("host");

    const isLocalHost = (value?: string | null) =>
      Boolean(
        value &&
          (value.includes("localhost") ||
            value.startsWith("127.0.0.1") ||
            value.startsWith("0.0.0.0")),
      );

    const detectedHost = forwardedHost ?? host;
    if (isLocalHost(detectedHost)) {
      const protocol = forwardedProto || "http";
      return `${protocol}://${detectedHost}`;
    }

    // 1. Use explicit APP_URL from env if set (production)
    if (env.NEXT_PUBLIC_APP_URL) {
      return env.NEXT_PUBLIC_APP_URL;
    }

    // 2. Build from x-forwarded-host (Vercel, proxies)
    if (forwardedHost) {
      const protocol = forwardedProto || "https";
      return `${protocol}://${forwardedHost}`;
    }

    // 3. Build from host header
    if (host) {
      const protocol = host.includes("localhost") ? "http" : "https";
      return `${protocol}://${host}`;
    }

    // 4. Fallback to localhost for development
    return "http://localhost:3000";
  };

  return {
    requestId,
    session,
    userId: session?.userId ?? null,
    cookies: cookieMethods,
    origin: getOriginUrl(),
    log,
  };
}
