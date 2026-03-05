"use client";

import { Button } from "@/components/ui/button";

const PERIODS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

interface AnalyticsDateRangeSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export function AnalyticsDateRangeSelector({
  selectedPeriod,
  onPeriodChange,
}: AnalyticsDateRangeSelectorProps) {
  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <Button
          key={p.label}
          variant={selectedPeriod === p.label ? "default" : "outline"}
          size="sm"
          onClick={() => onPeriodChange(p.label)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}

export function getPeriodDates(period: string): { from: string; to: string } {
  const to = new Date();
  const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
