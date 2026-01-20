"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  MapPin,
  ShieldCheck,
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
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import {
  useAdminStats,
  usePlaceVerificationQueue,
} from "@/features/admin/hooks";
import { useLogout, useSession } from "@/features/auth";
import { cn } from "@/lib/utils";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";

const statusConfig = {
  pending: {
    label: "Pending review",
    badgeVariant: "warning" as const,
    icon: Clock,
  },
  approved: {
    label: "Approved",
    badgeVariant: "success" as const,
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    badgeVariant: "destructive" as const,
    icon: AlertCircle,
  },
};

export default function AdminVerificationPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: stats } = useAdminStats();
  const { data: verificationQueue, isLoading } = usePlaceVerificationQueue({
    page: 1,
    limit: 12,
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.admin.placeVerification.base,
    );
  };

  const queueItems = verificationQueue?.items ?? [];
  const pendingCount = queueItems.filter(
    (item) => item.status === "pending",
  ).length;

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Verification Queue
            </h1>
            <p className="text-muted-foreground">
              Review place verification requests and keep listings trusted.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              {verificationQueue?.total ?? 0} requests
            </span>
          </div>
        </div>

        <Card className="border-dashed">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                Pending verification
              </CardTitle>
              <CardDescription>
                Review documents and confirm ownership before enabling bookings.
              </CardDescription>
            </div>
            <Badge variant="secondary">{pendingCount} pending</Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : queueItems.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p>No verification requests yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {queueItems.map((item) => {
                  const config = statusConfig[item.status];
                  const StatusIcon = config.icon;

                  return (
                    <Card key={item.id} className="border shadow-sm">
                      <CardContent className="space-y-4 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {item.placeName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Verification request
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              Submitted{" "}
                              {formatDistanceToNow(new Date(item.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                          <Badge
                            variant={config.badgeVariant}
                            className="flex items-center gap-1"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>

                        {item.requestNotes && (
                          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                            {item.requestNotes}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className={cn(
                            "w-full",
                            item.status !== "pending" && "opacity-80",
                          )}
                        >
                          <Link
                            href={appRoutes.admin.placeVerification.detail(
                              item.id,
                            )}
                          >
                            Review request
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
