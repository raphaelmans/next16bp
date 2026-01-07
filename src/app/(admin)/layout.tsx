import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/shared/infra/supabase/create-client";
import { env } from "@/lib/env";

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

  // TODO: Check if user has admin role
  // For now, we allow any authenticated user
  // In production, add role check:
  // const { data: profile } = await supabase
  //   .from("profiles")
  //   .select("role")
  //   .eq("id", user.id)
  //   .single();
  //
  // if (profile?.role !== "admin") {
  //   redirect("/unauthorized");
  // }

  return <>{children}</>;
}
