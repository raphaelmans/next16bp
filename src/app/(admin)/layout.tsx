import type { Metadata } from "next";
import { headers } from "next/headers";
import { appRoutes } from "@/common/app-routes";
import { AppClientProviders } from "@/common/providers/app-client-providers";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireAdminSession } from "@/lib/shared/infra/auth/server-session";

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

  return (
    <AppClientProviders>
      <DashboardShell>{children}</DashboardShell>
    </AppClientProviders>
  );
}
