"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RevenueByHourChartProps {
  data: { hour: number; totalCents: number }[];
}

const chartConfig = {
  totalCents: { label: "Revenue", color: "#0D9488" },
} satisfies ChartConfig;

function formatHour(hour: number): string {
  if (hour === 0) return "12AM";
  if (hour === 12) return "12PM";
  return hour < 12 ? `${hour}AM` : `${hour - 12}PM`;
}

export function RevenueByHourChart({ data }: RevenueByHourChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: formatHour(d.hour),
    totalCents: d.totalCents / 100,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart data={chartData} margin={{ left: 0, right: 12 }}>
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
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
                `P${Number(value).toLocaleString()}`
              }
            />
          }
        />
        <Bar dataKey="totalCents" fill="#0D9488" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
