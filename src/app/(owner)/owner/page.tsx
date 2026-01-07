"use client";

import { MapPin, CalendarDays, Clock, DollarSign } from "lucide-react";
import { DashboardLayout } from "@/shared/components/layout/dashboard-layout";
import {
  OwnerSidebar,
  OwnerNavbar,
  StatsCard,
  PendingActions,
  RecentActivity,
  TodaysBookings,
} from "@/features/owner";
import {
  useOwnerStats,
  useRecentActivity,
  useTodaysBookings,
} from "@/features/owner/hooks";
import { useSession, useLogout } from "@/features/auth";
import { formatCurrency } from "@/shared/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function OwnerDashboardPage() {
  const { data: user } = useSession();
  const { data: stats, isLoading: statsLoading } = useOwnerStats();
  const { data: activities, isLoading: activitiesLoading } =
    useRecentActivity();
  const { data: todaysBookings, isLoading: bookingsLoading } =
    useTodaysBookings();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  };

  // Mock organization data - replace with actual data
  const mockOrg = {
    id: "1",
    name: "My Sports Complex",
  };

  return (
    <DashboardLayout
      sidebar={
        <OwnerSidebar
          currentOrganization={mockOrg}
          organizations={[mockOrg]}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={mockOrg.name}
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
        <PendingActions pendingCount={stats?.pendingBookings ?? 0} />

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
                href="/owner/courts"
              />
              <StatsCard
                title="Pending Bookings"
                value={stats?.pendingBookings ?? 0}
                icon={CalendarDays}
                href="/owner/reservations?status=pending"
              />
              <StatsCard
                title="Today's Bookings"
                value={stats?.todaysBookings ?? 0}
                icon={Clock}
              />
              <StatsCard
                title="Revenue (Month)"
                value={formatCurrency(stats?.monthlyRevenue ?? 0)}
                icon={DollarSign}
                trend={{ value: 12, label: "vs last month" }}
              />
            </>
          )}
        </div>

        {/* Activity and bookings grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {activitiesLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <RecentActivity activities={activities} />
          )}

          {bookingsLoading ? (
            <Skeleton className="h-80" />
          ) : (
            <TodaysBookings bookings={todaysBookings} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
