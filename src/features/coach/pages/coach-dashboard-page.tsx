"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { formatCurrency } from "@/common/format";
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
import {
  useQueryCoachPendingCount,
  useQueryCoachReservations,
  useQueryCoachSetupStatus,
} from "../hooks";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Pending Review",
  AWAITING_PAYMENT: "Awaiting Payment",
  PAYMENT_MARKED_BY_USER: "Payment Marked",
  CONFIRMED: "Confirmed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CREATED: "default",
  AWAITING_PAYMENT: "secondary",
  PAYMENT_MARKED_BY_USER: "secondary",
  CONFIRMED: "default",
  EXPIRED: "destructive",
  CANCELLED: "destructive",
};

export function CoachDashboardPage() {
  const setupStatus = useQueryCoachSetupStatus();
  const pendingCount = useQueryCoachPendingCount();
  const upcomingReservations = useQueryCoachReservations({
    timeBucket: "upcoming",
    limit: 5,
  });
  const needsActionReservations = useQueryCoachReservations({
    statuses: ["CREATED", "PAYMENT_MARKED_BY_USER"],
    limit: 5,
  });

  const isSetupComplete = setupStatus.data?.isSetupComplete ?? false;
  const coachName = "Coach";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {coachName}
        </p>
      </div>

      {!isSetupComplete && setupStatus.data && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">
                Complete your coach profile
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Finish setup so players can find and book you.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={appRoutes.coach.getStarted}>Continue Setup</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl">
              {pendingCount.isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                (pendingCount.data ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Bookings awaiting your action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Sessions</CardDescription>
            <CardTitle className="text-3xl">
              {upcomingReservations.isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                (upcomingReservations.data?.length ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Confirmed upcoming bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Needs Action</CardDescription>
            <CardTitle className="text-3xl">
              {needsActionReservations.isLoading ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                (needsActionReservations.data?.length ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Review or confirm payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Needs Action */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Needs Action</CardTitle>
              <CardDescription>
                Bookings requiring your attention
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={appRoutes.coach.reservations}>View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {needsActionReservations.isLoading ? (
            <div className="space-y-3">
              {["sk-a", "sk-b", "sk-c"].map((key) => (
                <Skeleton key={key} className="h-16 w-full" />
              ))}
            </div>
          ) : !needsActionReservations.data?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No bookings need your action right now.
            </p>
          ) : (
            <div className="divide-y">
              {needsActionReservations.data.map((r) => (
                <Link
                  key={r.id}
                  href={appRoutes.coach.reservationDetail(r.id)}
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {r.playerNameSnapshot ?? "Player"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(r.slotStartTime)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.amountCents != null && r.currency && (
                      <span className="text-sm font-medium">
                        {formatCurrency(r.amountCents, r.currency)}
                      </span>
                    )}
                    <Badge variant={STATUS_VARIANTS[r.status] ?? "outline"}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your next scheduled bookings</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={appRoutes.coach.reservations}>View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingReservations.isLoading ? (
            <div className="space-y-3">
              {["sk-a", "sk-b", "sk-c"].map((key) => (
                <Skeleton key={key} className="h-16 w-full" />
              ))}
            </div>
          ) : !upcomingReservations.data?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No upcoming sessions.
            </p>
          ) : (
            <div className="divide-y">
              {upcomingReservations.data.map((r) => (
                <Link
                  key={r.id}
                  href={appRoutes.coach.reservationDetail(r.id)}
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {r.playerNameSnapshot ?? "Player"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(r.slotStartTime)} &middot;{" "}
                      {formatDateTime(r.slotStartTime).split(",").pop()?.trim()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.amountCents != null && r.currency && (
                      <span className="text-sm font-medium">
                        {formatCurrency(r.amountCents, r.currency)}
                      </span>
                    )}
                    <Badge variant={STATUS_VARIANTS[r.status] ?? "outline"}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
