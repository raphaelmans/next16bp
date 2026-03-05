"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface LeadTimeChartProps {
  data: { bucket: string; count: number; pct: number }[];
}

const chartConfig = {
  pct: { label: "% of bookings", color: "#D97706" },
} satisfies ChartConfig;

export function LeadTimeChart({ data }: LeadTimeChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No lead time data
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
          width={70}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `${value}%`}
            />
          }
        />
        <Bar dataKey="pct" fill="#D97706" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
