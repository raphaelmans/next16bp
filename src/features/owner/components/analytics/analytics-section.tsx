"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useQueryAnalyticsOperations,
  useQueryAnalyticsRevenue,
  useQueryAnalyticsUtilization,
} from "@/features/owner/hooks/analytics";
import {
  AnalyticsDateRangeSelector,
  getPeriodDates,
} from "./analytics-date-range-selector";
import { OperationsTab } from "./operations-tab";
import { RevenueTab } from "./revenue-tab";
import { UtilizationTab } from "./utilization-tab";

const TAB_VALUES = ["revenue", "utilization", "operations"] as const;

interface AnalyticsSectionProps {
  organizationId: string | null;
}

export function AnalyticsSection({ organizationId }: AnalyticsSectionProps) {
  const [activeTab, setActiveTab] = useQueryState(
    "analyticsTab",
    parseAsStringLiteral(TAB_VALUES).withDefault("revenue"),
  );
  const [period, setPeriod] = React.useState("7d");
  const { from, to } = React.useMemo(() => getPeriodDates(period), [period]);

  const revenueQuery = useQueryAnalyticsRevenue(
    organizationId,
    from,
    to,
    activeTab === "revenue",
  );

  const utilizationQuery = useQueryAnalyticsUtilization(
    organizationId,
    from,
    to,
    activeTab === "utilization",
  );

  const operationsQuery = useQueryAnalyticsOperations(
    organizationId,
    from,
    to,
    activeTab === "operations",
  );

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold font-heading">Analytics</h2>
        <AnalyticsDateRangeSelector
          selectedPeriod={period}
          onPeriodChange={setPeriod}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as (typeof TAB_VALUES)[number])}
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="revenue" className="flex-1 sm:flex-initial">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="utilization" className="flex-1 sm:flex-initial">
            Utilization
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex-1 sm:flex-initial">
            Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4">
          <RevenueTab
            data={revenueQuery.data}
            isLoading={revenueQuery.isLoading}
          />
        </TabsContent>

        <TabsContent value="utilization" className="mt-4">
          <UtilizationTab
            data={utilizationQuery.data}
            isLoading={utilizationQuery.isLoading}
          />
        </TabsContent>

        <TabsContent value="operations" className="mt-4">
          <OperationsTab
            data={operationsQuery.data}
            isLoading={operationsQuery.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
