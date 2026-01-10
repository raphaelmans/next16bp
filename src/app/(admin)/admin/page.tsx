"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Building2,
  Calendar,
  CheckCircle2,
  Plus,
  Tag,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminNavbar } from "@/features/admin/components/admin-navbar";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import {
  useAdminRecentActivity,
  useAdminStats,
  usePendingClaims,
} from "@/features/admin/hooks/use-admin-dashboard";
import { useLogout, useSession } from "@/features/auth";
import { StatsCard } from "@/features/owner/components/stats-card";
import { cn } from "@/lib/utils";
import { AppShell } from "@/shared/components/layout";

const activityIcons = {
  claim_approved: CheckCircle2,
  claim_rejected: XCircle,
  court_added: Plus,
  court_deactivated: Ban,
};

const activityColors = {
  claim_approved: "text-success",
  claim_rejected: "text-destructive",
  court_added: "text-primary",
  court_deactivated: "text-muted-foreground",
};

export default function AdminDashboardPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: pendingClaims = [], isLoading: claimsLoading } =
    usePendingClaims(5);
  const { data: recentActivity = [], isLoading: activityLoading } =
    useAdminRecentActivity(5);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
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
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage courts, claims, and platform settings
          </p>
        </div>

        {/* Stats Overview */}
        {statsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Pending Claims"
              value={stats?.pendingClaims || 0}
              icon={Tag}
              href="/admin/claims"
            />
            <StatsCard
              title="Total Courts"
              value={stats?.totalCourts || 0}
              icon={Building2}
              href="/admin/courts"
            />
            <StatsCard
              title="Reservable Courts"
              value={stats?.reservableCourts || 0}
              icon={Calendar}
            />
            <StatsCard
              title="Active Organizations"
              value={stats?.activeOrganizations || 0}
              icon={Users}
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Claims Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Pending Claims
                </CardTitle>
                <CardDescription>Claims awaiting your review</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/claims">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {claimsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : pendingClaims.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No pending claims</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingClaims.map((claim) => (
                    <Link
                      key={claim.id}
                      href={`/admin/claims/${claim.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{claim.courtName}</p>
                          <Badge
                            variant={
                              claim.type === "removal"
                                ? "destructive"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {claim.type === "removal" ? (
                              <Trash2 className="h-3 w-3 mr-1" />
                            ) : (
                              <Tag className="h-3 w-3 mr-1" />
                            )}
                            {claim.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {claim.organizationName} &middot;{" "}
                          {formatDistanceToNow(new Date(claim.submittedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest admin actions on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = activityIcons[activity.type];
                    const colorClass = activityColors[activity.type];

                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div
                          className={cn(
                            "rounded-full p-1.5 bg-muted",
                            colorClass,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), {
                              addSuffix: true,
                            })}{" "}
                            by {activity.actor}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
