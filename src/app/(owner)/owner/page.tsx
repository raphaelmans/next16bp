"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogout, useSession } from "@/features/auth";
import {
  ComingSoonCard,
  OwnerNavbar,
  OwnerSidebar,
  PendingActions,
  StatsCard,
} from "@/features/owner";
import { useOwnerOrganization, useOwnerStats } from "@/features/owner/hooks";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";

export default function OwnerDashboardPage() {
  const { data: user } = useSession();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();
  const { data: stats, isLoading: statsLoading } = useOwnerStats(
    organization?.id ?? null,
  );
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.base);
  };

  // Show loading skeleton while organization data loads
  if (orgLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "Loading..." }}
            organizations={[]}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName="Loading..."
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={
            organization ?? { id: "", name: "No Organization" }
          }
          organizations={organizations}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? "No Organization"}
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
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your courts today.
          </p>
        </div>

        {/* Pending actions alert */}
        <PendingActions pendingCount={stats?.pendingReservations ?? 0} />

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatsCard
                title="Active Courts"
                value={stats?.activeCourts ?? 0}
                icon={MapPin}
                href={appRoutes.owner.courts.base}
              />
              <StatsCard
                title="Pending Bookings"
                value={stats?.pendingReservations ?? 0}
                icon={CalendarDays}
                href={`${appRoutes.owner.reservations}?status=pending`}
              />
              <ComingSoonCard title="Today's Bookings" />
              <ComingSoonCard title="Monthly Revenue" />
            </>
          )}
        </div>

        {/* Activity and bookings grid - Coming Soon */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ComingSoonCard
            title="Recent Activity"
            description="Track recent bookings, payments, and cancellations"
          />
          <ComingSoonCard
            title="Today's Schedule"
            description="View today's bookings timeline"
          />
        </div>
      </div>
    </AppShell>
  );
}
