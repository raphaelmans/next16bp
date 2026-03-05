"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RevenueByDowChartProps {
  data: { dow: number; totalCents: number }[];
}

const chartConfig = {
  totalCents: { label: "Revenue", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

export function RevenueByDowChart({ data }: RevenueByDowChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: DOW_LABELS[d.dow] ?? `Day ${d.dow}`,
    totalCents: d.totalCents / 100,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart data={chartData} margin={{ left: 0, right: 12 }}>
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={(v: number) => `P${v.toLocaleString()}`}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `P${Number(value).toLocaleString()}`}
            />
          }
        />
        <Bar dataKey="totalCents" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
