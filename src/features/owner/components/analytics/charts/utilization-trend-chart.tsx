"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface UtilizationTrendChartProps {
  data: { date: string; utilizationPct: number }[];
}

const chartConfig = {
  utilizationPct: { label: "Utilization", color: "#059669" },
} satisfies ChartConfig;

export function UtilizationTrendChart({ data }: UtilizationTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    utilizationPct: d.utilizationPct,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => `${value}%`}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="utilizationPct"
          stroke="#059669"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
