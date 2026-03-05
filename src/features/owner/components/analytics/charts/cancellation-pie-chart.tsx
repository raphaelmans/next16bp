"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const REASON_LABELS: Record<string, string> = {
  expired: "Expired",
  owner_rejected: "Owner rejected",
  player_cancelled: "Player cancelled",
  system: "System",
};

const COLORS = ["#D97706", "#DC2626", "#0D9488", "#6B7280"];

interface CancellationPieChartProps {
  data: { reason: string; count: number; pct: number }[];
}

const chartConfig = {
  count: { label: "Count" },
} satisfies ChartConfig;

export function CancellationPieChart({ data }: CancellationPieChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No cancellations
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: REASON_LABELS[d.reason] ?? d.reason,
    count: d.count,
    pct: d.pct,
  }));

  return (
    <div className="flex items-center gap-4">
      <ChartContainer config={chartConfig} className="h-48 w-48 shrink-0">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, _name, entry) =>
                  `${value} (${(entry?.payload as { pct?: number })?.pct ?? 0}%)`
                }
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={70}
          >
            {chartData.map((_, i) => (
              <Cell
                key={chartData[i]?.name ?? i}
                fill={COLORS[i % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="space-y-1.5 text-sm">
        {chartData.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-muted-foreground">
              {d.name} ({d.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
