"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RevenueByCourtChartProps {
  data: { courtId: string; courtLabel: string; totalCents: number }[];
}

const chartConfig = {
  totalCents: { label: "Revenue", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export function RevenueByCourtChart({ data }: RevenueByCourtChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.courtLabel,
    totalCents: d.totalCents / 100,
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
          tickFormatter={(v: number) => `P${v.toLocaleString()}`}
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
          content={
            <ChartTooltipContent
              formatter={(value) => `P${Number(value).toLocaleString()}`}
            />
          }
        />
        <Bar
          dataKey="totalCents"
          fill="var(--color-chart-1)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
