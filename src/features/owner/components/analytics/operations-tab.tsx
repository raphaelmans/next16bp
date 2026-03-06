"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OperationsOutput } from "@/lib/modules/analytics/dtos/analytics.dto";
import { AnalyticsKpiCard } from "./analytics-kpi-card";
import { BookingsByHourChart } from "./charts/bookings-by-hour-chart";
import { CancellationPieChart } from "./charts/cancellation-pie-chart";
import { LeadTimeChart } from "./charts/lead-time-chart";
import { ResponseTimeChart } from "./charts/response-time-chart";

interface OperationsTabProps {
  data: OperationsOutput | undefined;
  isLoading: boolean;
}

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return "N/A";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatLeadTime(hours: number | null): string {
  if (hours === null) return "N/A";
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days} days`;
}

export function OperationsTab({ data, isLoading }: OperationsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnalyticsKpiCard
          title="Median Response Time"
          value={formatResponseTime(data.kpis.medianResponseMinutes)}
        />
        <AnalyticsKpiCard
          title="Cancellation Rate"
          value={`${data.kpis.cancellationRate}%`}
        />
        <AnalyticsKpiCard
          title="Avg Lead Time"
          value={formatLeadTime(data.kpis.avgLeadTimeHours)}
        />
      </div>

      {/* Response Time + Cancellation side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Response Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponseTimeChart data={data.responseTimeBuckets} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cancellation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CancellationPieChart data={data.cancellationBreakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Lead Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Booking Lead Time</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadTimeChart data={data.leadTimeBuckets} />
        </CardContent>
      </Card>

      {/* Bookings by Hour Created */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bookings by Hour Created</CardTitle>
          <p className="text-xs text-muted-foreground">
            When players submit bookings
          </p>
        </CardHeader>
        <CardContent>
          <BookingsByHourChart data={data.bookingsByHourCreated} />
        </CardContent>
      </Card>
    </div>
  );
}
