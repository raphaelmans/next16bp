"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface UtilizationByCourtChartProps {
  data: { courtId: string; courtLabel: string; utilizationPct: number }[];
}

const chartConfig = {
  utilizationPct: { label: "Utilization", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

export function UtilizationByCourtChart({
  data,
}: UtilizationByCourtChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.courtLabel,
    utilizationPct: d.utilizationPct,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 8, right: 12 }}
      >
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
        />
        <Bar
          dataKey="utilizationPct"
          fill="var(--color-chart-3)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
