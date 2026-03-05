"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ResponseTimeChartProps {
  data: { bucket: string; count: number; pct: number }[];
}

const chartConfig = {
  pct: { label: "% of bookings", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No response data
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${v}%`}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="bucket"
          tickLine={false}
          axisLine={false}
          width={50}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
        />
        <Bar dataKey="pct" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
