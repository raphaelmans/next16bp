"use client";

import * as React from "react";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import { useAdminSidebarStats } from "@/features/admin/hooks";
import { useLogout, useSession } from "@/features/auth";
import { revalidateHomeAction } from "./actions";

export default function AdminRevalidatePage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const { data: stats } = useAdminSidebarStats();

  const [confirmRevalidate, setConfirmRevalidate] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const goBack = () => {
    window.location.assign(appRoutes.admin.base);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.admin.base);
  };

  const handleRevalidate = () => {
    startTransition(async () => {
      try {
        const result = await revalidateHomeAction({ confirm: true });
        if (!result.ok) {
          toast.error("Revalidation failed", {
            description: result.error,
          });
          return;
        }
        toast.success("Revalidation triggered", {
          description: `path: ${result.path} | tag: ${result.tag}`,
        });
      } catch (error) {
        toast.error("Revalidation failed", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      }
    });
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
      <div className="space-y-6">
        <PageHeader
          title="Revalidate"
          description="Trigger on-demand revalidation for cached pages"
          breadcrumbs={[
            { label: "Admin", href: appRoutes.admin.base },
            { label: "Tools" },
            { label: "Revalidate" },
          ]}
          backHref={appRoutes.admin.base}
        />

        <Card>
          <CardHeader>
            <CardTitle>Home page</CardTitle>
            <CardDescription>
              This will mark the homepage (/) for revalidation on the next
              visit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Cache tag: <code>home:featured</code>
            </p>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={confirmRevalidate}
                onCheckedChange={(checked) =>
                  setConfirmRevalidate(Boolean(checked))
                }
              />
              <div className="text-sm">
                I understand this will refresh the cached homepage
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRevalidate}
                disabled={isPending || !confirmRevalidate}
              >
                {isPending ? "Revalidating..." : "Revalidate / (Home)"}
              </Button>
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
