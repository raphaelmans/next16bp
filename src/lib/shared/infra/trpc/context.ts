import type { CookieMethodsServer } from "@supabase/ssr";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { makeUserRoleRepository } from "@/lib/modules/user-role/factories/user-role.factory";
import { getClientIdentifier } from "@/lib/shared/infra/http/client-identifier";
import { createRequestLogger } from "@/lib/shared/infra/logger";
import { createClient } from "@/lib/shared/infra/supabase/create-client";
import type { Session } from "@/lib/shared/kernel/auth";

export interface Context {
  requestId: string;
  clientIdentifier: string;
  clientIdentifierSource: "ip" | "fallback";
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
  const clientIdentifier = getClientIdentifier(req);
  const cookieStore = await cookies();

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

  if (process.env.NODE_ENV === "production" && !env.NEXT_PUBLIC_APP_URL) {
    throw new Error("NEXT_PUBLIC_APP_URL is required in production");
  }

  const origin = env.NEXT_PUBLIC_APP_URL
    ? env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : new URL(req.url).origin;

  return {
    requestId,
    clientIdentifier: clientIdentifier.value,
    clientIdentifierSource: clientIdentifier.source,
    session,
    userId: session?.userId ?? null,
    cookies: cookieMethods,
    origin,
    log,
  };
}
