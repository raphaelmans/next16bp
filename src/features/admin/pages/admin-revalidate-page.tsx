"use client";

import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
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
import { useQueryAdminSidebarStats } from "@/features/admin/hooks";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  revalidateHomeFeaturedVenuesAction,
  revalidatePublicCourtsPagesAction,
} from "@/lib/modules/admin/server/revalidate-actions";

type PendingRevalidation = "featured-venues" | "public-courts-pages" | null;

export default function AdminRevalidatePage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const { data: stats } = useQueryAdminSidebarStats();

  const [confirmFeaturedVenuesRefresh, setConfirmFeaturedVenuesRefresh] =
    React.useState(false);
  const [confirmPublicCourtsRefresh, setConfirmPublicCourtsRefresh] =
    React.useState(false);
  const [pendingRevalidation, setPendingRevalidation] =
    React.useState<PendingRevalidation>(null);
  const [isPending, startTransition] = React.useTransition();

  const goBack = () => {
    window.location.assign(appRoutes.admin.base);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.admin.base);
  };

  const handleFeaturedVenuesRefresh = () => {
    startTransition(async () => {
      setPendingRevalidation("featured-venues");
      try {
        const result = await revalidateHomeFeaturedVenuesAction({
          confirm: true,
        });
        if (!result.ok) {
          toast.error("Featured venues refresh failed", {
            description: result.error,
          });
          return;
        }
        toast.success("Featured venues refresh triggered", {
          description: `path: ${result.path} | tag: ${result.tag}`,
        });
      } catch (error) {
        toast.error("Featured venues refresh failed", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      } finally {
        setPendingRevalidation(null);
      }
    });
  };

  const handlePublicCourtsRefresh = () => {
    startTransition(async () => {
      setPendingRevalidation("public-courts-pages");
      try {
        const result = await revalidatePublicCourtsPagesAction({
          confirm: true,
        });
        if (!result.ok) {
          toast.error("Public courts refresh failed", {
            description: result.error,
          });
          return;
        }
        toast.success("Public courts refresh triggered", {
          description: result.targets.join(" | "),
        });
      } catch (error) {
        toast.error("Public courts refresh failed", {
          description: getClientErrorMessage(error, "Please try again"),
        });
      } finally {
        setPendingRevalidation(null);
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
            <CardTitle>Landing page featured venues</CardTitle>
            <CardDescription>
              Refreshes the featured venues cache used on the landing page and
              marks <code>/</code> stale for the next visit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Cache tag: <code>home:featured</code>
            </p>
            <p className="text-xs text-muted-foreground">
              Featured-rank updates in admin revalidate this automatically. This
              control is the manual fallback.
            </p>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={confirmFeaturedVenuesRefresh}
                onCheckedChange={(checked) =>
                  setConfirmFeaturedVenuesRefresh(Boolean(checked))
                }
              />
              <div className="text-sm">
                I understand this will refresh featured venues on the landing
                page
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleFeaturedVenuesRefresh}
                disabled={isPending || !confirmFeaturedVenuesRefresh}
              >
                {isPending && pendingRevalidation === "featured-venues"
                  ? "Refreshing..."
                  : "Refresh Landing Featured Venues"}
              </Button>
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public courts pages</CardTitle>
            <CardDescription>
              Refreshes <code>/courts</code> plus all
              <code> /courts/locations/**</code> page patterns for the next
              visit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Targets: <code>/courts</code>,{" "}
              <code>/courts/locations/[province]</code>,{" "}
              <code>/courts/locations/[province]/[city]</code>,{" "}
              <code>/courts/locations/[province]/[city]/[sport]</code>
            </p>
            <p className="text-xs text-muted-foreground">
              Use this after updating public discovery data that affects the
              courts index or location landing pages.
            </p>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={confirmPublicCourtsRefresh}
                onCheckedChange={(checked) =>
                  setConfirmPublicCourtsRefresh(Boolean(checked))
                }
              />
              <div className="text-sm">
                I understand this will refresh public courts discovery pages
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handlePublicCourtsRefresh}
                disabled={isPending || !confirmPublicCourtsRefresh}
              >
                {isPending && pendingRevalidation === "public-courts-pages"
                  ? "Refreshing..."
                  : "Refresh Public Courts Pages"}
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
