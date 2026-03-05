"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RevenueByDay {
  date: string;
  totalCents: number;
  bookingCount: number;
}

interface RevenueTrendChartProps {
  data: RevenueByDay[];
  previousData: RevenueByDay[];
}

const chartConfig = {
  current: { label: "Current", color: "#0D9488" },
  previous: { label: "Previous", color: "#D1D5DB" },
} satisfies ChartConfig;

function formatCurrency(cents: number): string {
  return `P${(cents / 100).toLocaleString()}`;
}

export function RevenueTrendChart({
  data,
  previousData,
}: RevenueTrendChartProps) {
  const merged = data.map((d, i) => ({
    date: d.date.slice(5),
    current: d.totalCents / 100,
    previous: (previousData[i]?.totalCents ?? 0) / 100,
  }));

  if (merged.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No revenue data for this period
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <AreaChart data={merged} margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={(v: number) => `P${v.toLocaleString()}`}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) =>
                formatCurrency(Number(value) * 100)
              }
            />
          }
        />
        <Area
          type="monotone"
          dataKey="previous"
          stroke="#D1D5DB"
          fill="transparent"
          strokeDasharray="5 5"
          strokeWidth={1.5}
        />
        <Area
          type="monotone"
          dataKey="current"
          stroke="#0D9488"
          fill="#0D948820"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
