"use client";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { SETTINGS_SECTION_HASHES } from "@/common/section-hashes";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  OwnerNavbar,
  OwnerPaymentMethodReminder,
  OwnerSidebar,
  PendingActions,
  RecentActivity,
  ReservationAlertsPanel,
  StatsCard,
  TodaysBookings,
} from "@/features/owner";
import { AnalyticsSection } from "@/features/owner/components/analytics/analytics-section";
import { shouldShowOwnerNotificationRoutingWarning } from "@/features/owner/domain";
import { isOwnerSetupIncomplete } from "@/features/owner/helpers";
import {
  useQueryDashboardData,
  useQueryOwnerOrganization,
  useQueryOwnerSetupStatus,
  useQueryOwnerStats,
  useQueryReservationNotificationRoutingStatus,
} from "@/features/owner/hooks";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";
import {
  hasPermission,
  isOwnerRole,
} from "@/lib/modules/organization-member/shared/permissions";

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
  const { data: dashboardData, isLoading: dashboardLoading } =
    useQueryDashboardData(organization?.id ?? null);
  const routingStatusQuery = useQueryReservationNotificationRoutingStatus(
    organization?.id ?? undefined,
  );
  const { data: setupStatus, isLoading: setupLoading } =
    useQueryOwnerSetupStatus();
  const { permissionContext } = useModOwnerPermissionContext();
  const logoutMutation = useMutAuthLogout();
  const normalizedSetupStatus = setupStatus
    ? {
        isSetupComplete: setupStatus.isSetupComplete,
        hasPaymentMethod: setupStatus.hasPaymentMethod,
        nextStep: setupStatus.nextStep,
      }
    : null;

  const showSetupCta =
    !setupLoading &&
    isOwnerSetupIncomplete(normalizedSetupStatus) &&
    (permissionContext ? isOwnerRole(permissionContext) : false);
  const canConfigureNotificationRouting = Boolean(
    permissionContext &&
      hasPermission(permissionContext, "reservation.notification.receive"),
  );
  const nextStepLabel = setupStatus
    ? setupStatus.nextStep === "verify_venue" &&
      setupStatus.verificationStatus === "PENDING"
      ? "Verification under review"
      : OWNER_SETUP_NEXT_STEP_LABELS[setupStatus.nextStep]
    : null;

  const showNotificationRoutingWarning =
    shouldShowOwnerNotificationRoutingWarning({
      organizationId: organization?.id,
      canConfigureRouting: canConfigureNotificationRouting,
      isRoutingStatusLoading: routingStatusQuery.isLoading,
      enabledRecipientCount: routingStatusQuery.data?.enabledRecipientCount,
    });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.organization.base);
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
          <div className="grid gap-4 sm:grid-cols-3">
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
                  Finish setting up your venue
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete the remaining steps to start accepting bookings.
                  {nextStepLabel ? ` Next up: ${nextStepLabel}.` : ""}
                </p>
              </div>
              <Button asChild>
                <Link href={appRoutes.organization.getStarted}>
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <OwnerPaymentMethodReminder />

        {showNotificationRoutingWarning && (
          <Card className="border-warning/30 bg-warning/10">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-heading font-semibold text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Reservation notifications are muted
                </p>
                <p className="text-sm text-muted-foreground">
                  No venue members have enabled reservation notification
                  routing.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link
                  href={`${appRoutes.organization.settings}${SETTINGS_SECTION_HASHES.reservationNotificationRouting}`}
                >
                  Configure recipients
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending actions alert */}
        <PendingActions pendingCount={stats?.pendingReservations ?? 0} />

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {statsLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatsCard
                title="Pending Bookings"
                value={stats?.pendingReservations ?? 0}
                icon={CalendarDays}
                href={`${appRoutes.organization.reservations}?status=pending`}
              />
              <StatsCard
                title="Today's Bookings"
                value={dashboardData?.todayBookingsCount ?? 0}
                icon={CalendarCheck}
              />
              <StatsCard
                title="Active Courts"
                value={stats?.activeCourts ?? 0}
                icon={MapPin}
                href={appRoutes.organization.courts.base}
              />
            </>
          )}
        </div>

        {/* Analytics CTA */}
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("analytics-section")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="flex w-full items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/70"
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span>View detailed analytics — revenue, utilization &amp; operations</span>
          <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0" />
        </button>

        <div className="grid gap-6 lg:grid-cols-2">
          {dashboardLoading ? (
            <>
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </>
          ) : (
            <>
              <RecentActivity
                activities={dashboardData?.recentActivity ?? []}
              />
              <TodaysBookings bookings={dashboardData?.todaySchedule ?? []} />
            </>
          )}
        </div>

        {/* Analytics Section */}
        <div id="analytics-section" className="border-t pt-6 scroll-mt-4">
          <AnalyticsSection organizationId={organization?.id ?? null} />
        </div>
      </div>
    </AppShell>
  );
}
