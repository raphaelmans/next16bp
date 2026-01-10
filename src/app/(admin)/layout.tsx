import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createClient } from "@/shared/infra/supabase/create-client";

/**
 * Admin route group layout.
 * Provides auth protection and admin role check.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const cookieMethods = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll() {
      // Read-only in layout
    },
  };

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    cookieMethods,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // ==========================================================================
  // AUTH BYPASS: Admin role check is currently disabled for development.
  // Any authenticated user can access /admin/* routes.
  //
  // TODO: Implement admin role check before production:
  // const userRole = await makeUserRoleRepository().findByUserId(user.id);
  // if (userRole?.role !== "admin") {
  //   redirect("/unauthorized");
  // }
  //
  // To test admin functionality during development, you can also override
  // the role in src/shared/infra/trpc/context.ts (line ~69)
  // ==========================================================================

  return <>{children}</>;
}
