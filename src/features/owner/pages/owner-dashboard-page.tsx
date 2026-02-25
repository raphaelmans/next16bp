"use client";

import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  ComingSoonCard,
  OwnerNavbar,
  OwnerPaymentMethodReminder,
  OwnerSidebar,
  PendingActions,
  ReservationAlertsPanel,
  StatsCard,
} from "@/features/owner";
import { isOwnerSetupIncomplete } from "@/features/owner/helpers";
import {
  useQueryOwnerOrganization,
  useQueryOwnerSetupStatus,
  useQueryOwnerStats,
} from "@/features/owner/hooks";

const OWNER_SETUP_NEXT_STEP_LABELS = {
  create_organization: "Create your organization",
  add_or_claim_venue: "Add or claim a venue",
  claim_pending: "Claim pending review",
  verify_venue: "Submit verification",
  configure_courts: "Set up courts",
  add_payment_method: "Add a payment method",
  complete: "Setup complete",
} as const;

export default function OwnerDashboardPage() {
  const { data: user } = useQueryAuthSession();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();
  const { data: stats, isLoading: statsLoading } = useQueryOwnerStats(
    organization?.id ?? null,
  );
  const { data: setupStatus, isLoading: setupLoading } =
    useQueryOwnerSetupStatus();
  const logoutMutation = useMutAuthLogout();
  const normalizedSetupStatus = setupStatus
    ? {
        isSetupComplete: setupStatus.isSetupComplete,
        hasPaymentMethod: setupStatus.hasPaymentMethod,
        nextStep: setupStatus.nextStep,
      }
    : null;

  const showSetupCta =
    !setupLoading && isOwnerSetupIncomplete(normalizedSetupStatus);
  const nextStepLabel = setupStatus
    ? setupStatus.nextStep === "verify_venue" &&
      setupStatus.verificationStatus === "PENDING"
      ? "Verification under review"
      : OWNER_SETUP_NEXT_STEP_LABELS[setupStatus.nextStep]
    : null;

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
        floatingPanel={<ReservationAlertsPanel organizationId={null} />}
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
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
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

        {showSetupCta && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-heading font-semibold">
                  Finish your owner setup
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete the remaining steps to start accepting bookings.
                  {nextStepLabel ? ` Next up: ${nextStepLabel}.` : ""}
                </p>
              </div>
              <Button asChild>
                <Link href={appRoutes.owner.getStarted}>
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <OwnerPaymentMethodReminder />

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
