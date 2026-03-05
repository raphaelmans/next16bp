"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { UtilizationOutput } from "@/lib/modules/analytics/dtos/analytics.dto";
import { AnalyticsKpiCard } from "./analytics-kpi-card";
import { UtilizationByCourtChart } from "./charts/utilization-by-court-chart";
import { UtilizationHeatmap } from "./charts/utilization-heatmap";
import { UtilizationTrendChart } from "./charts/utilization-trend-chart";

interface UtilizationTabProps {
  data: UtilizationOutput | undefined;
  isLoading: boolean;
}

export function UtilizationTab({ data, isLoading }: UtilizationTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
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
          title="Overall Utilization"
          value={`${data.kpis.overallUtilizationPct}%`}
        />
        <AnalyticsKpiCard
          title="Peak Utilization"
          value={`${data.kpis.peakUtilizationPct}%`}
        />
        <AnalyticsKpiCard
          title="Maintenance Hours"
          value={`${data.kpis.maintenanceHours}h`}
        />
      </div>

      {/* Utilization by Court */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Utilization by Court</CardTitle>
        </CardHeader>
        <CardContent>
          <UtilizationByCourtChart data={data.byCourt} />
        </CardContent>
      </Card>

      {/* Weekly Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <UtilizationHeatmap data={data.heatmap} />
        </CardContent>
      </Card>

      {/* Utilization Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Utilization Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <UtilizationTrendChart data={data.byDay} />
        </CardContent>
      </Card>
    </div>
  );
}
