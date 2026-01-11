import type { CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { makeUserRoleRepository } from "@/modules/user-role/factories/user-role.factory";
import { createClient } from "@/shared/infra/supabase/create-client";
import type { Session } from "@/shared/kernel/auth";
import { appRoutes } from "@/shared/lib/app-routes";

const createCookieMethods = async (): Promise<CookieMethodsServer> => {
  const cookieStore = await cookies();

  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Server Component - ignore write attempts
        }
      });
    },
  } satisfies CookieMethodsServer;
};

export async function getServerSession(): Promise<Session | null> {
  const cookieMethods = await createCookieMethods();
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    cookieMethods,
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const userRole = await makeUserRoleRepository().findByUserId(user.id);

    return {
      userId: user.id,
      email: user.email ?? "",
      role: (userRole?.role as Session["role"]) ?? "member",
    };
  } catch {
    return null;
  }
}

export async function requireSession(pathname: string): Promise<Session> {
  const session = await getServerSession();

  if (!session) {
    redirect(appRoutes.login.from(pathname));
  }

  return session;
}

export async function requireAdminSession(pathname: string): Promise<Session> {
  const session = await requireSession(pathname);

  if (session.role !== "admin") {
    redirect(appRoutes.home.base);
  }

  return session;
}
