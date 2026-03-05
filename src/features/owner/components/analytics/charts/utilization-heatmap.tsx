"use client";

import { cn } from "@/lib/utils";

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = [6, 8, 10, 12, 14, 16, 18, 20];

interface UtilizationHeatmapProps {
  data: { dow: number; hour: number; utilizationPct: number }[];
}

function getCellColor(pct: number): string {
  if (pct >= 75) return "bg-teal-600";
  if (pct >= 50) return "bg-teal-400";
  if (pct >= 25) return "bg-teal-200";
  if (pct > 0) return "bg-teal-100";
  return "bg-muted";
}

export function UtilizationHeatmap({ data }: UtilizationHeatmapProps) {
  const cellMap = new Map<string, number>();
  for (const cell of data) {
    cellMap.set(`${cell.dow}-${cell.hour}`, cell.utilizationPct);
  }

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No utilization data for this period
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Hour labels */}
          <div className="flex">
            <div className="w-10 shrink-0" />
            {HOUR_LABELS.map((h) => (
              <div
                key={h}
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                {h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {DOW_LABELS.map((label, dow) => (
            <div key={label} className="flex items-center gap-0.5">
              <div className="w-10 shrink-0 text-xs text-muted-foreground">
                {label}
              </div>
              {HOUR_LABELS.map((h) => {
                const pct = cellMap.get(`${dow}-${h}`) ?? 0;
                return (
                  <div
                    key={h}
                    className={cn(
                      "flex-1 rounded-sm h-6",
                      getCellColor(pct),
                    )}
                    title={`${label} ${h}:00 - ${pct}%`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-muted" /> 0%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-teal-100" />{" "}
          1-25%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-teal-200" />{" "}
          25-50%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-teal-400" />{" "}
          50-75%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-teal-600" />{" "}
          75%+
        </span>
      </div>
    </div>
  );
}
