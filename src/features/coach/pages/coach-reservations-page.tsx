"use client";

import Link from "next/link";
import { useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { formatCurrency } from "@/common/format";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryCoachReservations } from "../hooks";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
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

type FilterTab =
  | "all"
  | "needs-action"
  | "awaiting-payment"
  | "confirmed"
  | "past";

const TAB_FILTERS: Record<
  FilterTab,
  {
    statuses?: string[];
    timeBucket?: "past" | "upcoming";
  }
> = {
  all: {},
  "needs-action": { statuses: ["CREATED", "PAYMENT_MARKED_BY_USER"] },
  "awaiting-payment": { statuses: ["AWAITING_PAYMENT"] },
  confirmed: { statuses: ["CONFIRMED"], timeBucket: "upcoming" },
  past: { timeBucket: "past" },
};

export function CoachReservationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filters = TAB_FILTERS[activeTab];
  const reservations = useQueryCoachReservations({
    ...filters,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Reservations
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your coaching bookings
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FilterTab)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="needs-action">Needs Action</TabsTrigger>
          <TabsTrigger value="awaiting-payment">Awaiting Payment</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "all"
              ? "All Reservations"
              : activeTab === "needs-action"
                ? "Needs Your Action"
                : activeTab === "awaiting-payment"
                  ? "Awaiting Player Payment"
                  : activeTab === "confirmed"
                    ? "Upcoming Confirmed"
                    : "Past Reservations"}
          </CardTitle>
          <CardDescription>
            {activeTab === "needs-action"
              ? "Accept or reject booking requests, confirm payments"
              : activeTab === "awaiting-payment"
                ? "Accepted bookings waiting for player payment"
                : "View and manage your reservations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reservations.isLoading ? (
            <div className="space-y-3">
              {["sk-a", "sk-b", "sk-c", "sk-d", "sk-e"].map((key) => (
                <Skeleton key={key} className="h-20 w-full" />
              ))}
            </div>
          ) : !reservations.data?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No reservations found.
            </p>
          ) : (
            <div className="divide-y">
              {reservations.data.map((r) => (
                <Link
                  key={r.id}
                  href={appRoutes.coach.reservationDetail(r.id)}
                  className="block py-4 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {r.playerNameSnapshot ?? "Player"}
                        </p>
                        <Badge variant={STATUS_VARIANTS[r.status] ?? "outline"}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(r.slotStartTime)} &ndash;{" "}
                        {formatDateTime(r.slotEndTime)}
                      </p>
                      {r.playerEmailSnapshot && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {r.playerEmailSnapshot}
                          {r.playerPhoneSnapshot
                            ? ` · ${r.playerPhoneSnapshot}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {r.amountCents != null && r.currency && (
                        <p className="font-medium">
                          {formatCurrency(r.amountCents, r.currency)}
                        </p>
                      )}
                      {r.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Booked{" "}
                          {new Intl.DateTimeFormat("en-PH", {
                            dateStyle: "short",
                          }).format(new Date(r.createdAt))}
                        </p>
                      )}
                    </div>
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
