"use client";

import { usePathname } from "next/navigation";
import type * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { AdminNavbar } from "@/features/admin/components/admin-navbar";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { useAdminSidebarStats } from "@/features/admin/hooks";
import { useLogout, useSession } from "@/features/auth";

interface AdminPageFrameProps {
  children: React.ReactNode;
  redirectPath?: string;
}

export function AdminPageFrame({
  children,
  redirectPath,
}: AdminPageFrameProps) {
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const { data: stats } = useAdminSidebarStats();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(redirectPath ?? pathname);
  };

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          pendingClaimsCount={stats?.pendingClaims || 0}
          pendingVerificationsCount={stats?.pendingVerifications || 0}
        />
      }
      navbar={
        <AdminNavbar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
    >
      {children}
    </AppShell>
  );
}
