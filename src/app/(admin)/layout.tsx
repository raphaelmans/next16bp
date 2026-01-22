import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireAdminSession } from "@/shared/infra/auth/server-session";
import { appRoutes } from "@/shared/lib/app-routes";

/**
 * Admin route group layout.
 * Provides auth protection and admin role check.
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? appRoutes.admin.base;

  await requireAdminSession(pathname);

  return <>{children}</>;
}
