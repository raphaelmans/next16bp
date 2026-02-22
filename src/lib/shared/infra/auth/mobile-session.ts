import type { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { makeUserRoleRepository } from "@/lib/modules/user-role/factories/user-role.factory";
import { normalizeUserRole, type Session } from "@/lib/shared/kernel/auth";
import { AuthenticationError } from "@/lib/shared/kernel/errors";

function parseBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;

  return token.trim();
}

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseAdmin;
}

async function getUserFromAccessToken(token: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    console.error("[mobile-session] getUser failed", {
      errorMessage: error.message,
      errorStatus: error.status,
      tokenPrefix: token.slice(0, 20),
      supabaseUrl: env.SUPABASE_URL,
    });
    return null;
  }

  return data.user;
}

export async function getMobileSession(req: Request): Promise<Session | null> {
  const token = parseBearerToken(req);
  if (!token) return null;

  const user = await getUserFromAccessToken(token);
  if (!user) return null;

  const userRole = await makeUserRoleRepository().findByUserId(user.id);

  return {
    userId: user.id,
    email: user.email ?? "",
    role: normalizeUserRole(userRole?.role),
  };
}

export async function requireMobileSession(req: Request): Promise<Session> {
  const session = await getMobileSession(req);
  if (!session || !session.userId) {
    throw new AuthenticationError("Authentication required");
  }
  return session;
}
