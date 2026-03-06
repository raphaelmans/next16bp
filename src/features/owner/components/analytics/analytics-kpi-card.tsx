"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsKpiCardProps {
  title: string;
  value: string;
  trend?: {
    value: number;
    label: string;
  };
  isLoading?: boolean;
}

export function AnalyticsKpiCard({
  title,
  value,
  trend,
  isLoading,
}: AnalyticsKpiCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold font-heading">{value}</p>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {trend.value >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            )}
            <span
              className={trend.value >= 0 ? "text-success" : "text-destructive"}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
