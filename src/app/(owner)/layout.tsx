import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/shared/infra/supabase/create-client";
import { env } from "@/lib/env";

/**
 * Owner route group layout.
 * Provides auth protection and organization check.
 */
export default async function OwnerLayout({
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
    redirect("/login?redirect=/owner");
  }

  // TODO: Check if user has an organization
  // If no organization, redirect to create org page
  // const hasOrg = await checkUserHasOrganization(user.id);
  // if (!hasOrg) {
  //   redirect("/owner/onboarding");
  // }

  return <>{children}</>;
}
