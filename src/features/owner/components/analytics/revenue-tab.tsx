"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RevenueOutput } from "@/lib/modules/analytics/dtos/analytics.dto";
import { AnalyticsKpiCard } from "./analytics-kpi-card";
import { RevenueByCourtChart } from "./charts/revenue-by-court-chart";
import { RevenueByDowChart } from "./charts/revenue-by-dow-chart";
import { RevenueByHourChart } from "./charts/revenue-by-hour-chart";
import { RevenueTrendChart } from "./charts/revenue-trend-chart";

interface RevenueTabProps {
  data: RevenueOutput | undefined;
  isLoading: boolean;
}

function formatCurrency(cents: number): string {
  return `P${(cents / 100).toLocaleString()}`;
}

function calcPctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function RevenueTab({ data, isLoading }: RevenueTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data) return null;

  const pctChange = calcPctChange(
    data.kpis.totalRevenueCents,
    data.kpis.previousTotalRevenueCents,
  );

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnalyticsKpiCard
          title="Total Revenue"
          value={formatCurrency(data.kpis.totalRevenueCents)}
          trend={{
            value: pctChange,
            label: "vs previous period",
          }}
        />
        <AnalyticsKpiCard
          title="Avg Booking Value"
          value={formatCurrency(data.kpis.avgBookingValueCents)}
        />
        <AnalyticsKpiCard
          title="Total Bookings"
          value={data.kpis.bookingCount.toString()}
          trend={{
            value: calcPctChange(
              data.kpis.bookingCount,
              data.kpis.previousBookingCount,
            ),
            label: "vs previous period",
          }}
        />
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueTrendChart
            data={data.byDay}
            previousData={data.previousByDay}
          />
        </CardContent>
      </Card>

      {/* Revenue by Court + DOW side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Court</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueByCourtChart data={data.byCourt} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueByDowChart data={data.byDow} />
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Hour */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueByHourChart data={data.byHour} />
        </CardContent>
      </Card>
    </div>
  );
}
