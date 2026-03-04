import { randomUUID } from "node:crypto";
import type { CookieMethodsServer } from "@supabase/ssr";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { cookies } from "next/headers";
import { getRequestOrigin } from "@/common/request-origin";
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
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
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
      let role: Session["role"] = "member";
      try {
        // Fetch role from user_roles table (fallback to member).
        const userRole = await makeUserRoleRepository().findByUserId(user.id);
        role = (userRole?.role as Session["role"]) ?? "member";
      } catch {
        role = "member";
      }

      session = {
        userId: user.id,
        email: user.email ?? "",
        role,
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

  return {
    requestId,
    session,
    userId: session?.userId ?? null,
    cookies: cookieMethods,
    origin: getRequestOrigin(req),
    log,
  };
}
