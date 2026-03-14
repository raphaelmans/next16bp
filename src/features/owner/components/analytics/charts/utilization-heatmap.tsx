"use client";

import { cn } from "@/lib/utils";

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = [6, 8, 10, 12, 14, 16, 18, 20];

/** Mobile compact time blocks: group 8 hours into 4 blocks */
const TIME_BLOCKS = [
  { label: "Morning", hours: [6, 8] },
  { label: "Midday", hours: [10, 12] },
  { label: "Afternoon", hours: [14, 16] },
  { label: "Evening", hours: [18, 20] },
] as const;

interface UtilizationHeatmapProps {
  data: { dow: number; hour: number; utilizationPct: number }[];
}

function getCellColor(pct: number): string {
  if (pct >= 75) return "bg-primary";
  if (pct >= 50) return "bg-primary/60";
  if (pct >= 25) return "bg-primary/30";
  if (pct > 0) return "bg-primary/15";
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

  /** Average utilization across the hours in a time block for a given day */
  function getBlockPct(dow: number, hours: readonly number[]): number {
    let sum = 0;
    let count = 0;
    for (const h of hours) {
      sum += cellMap.get(`${dow}-${h}`) ?? 0;
      count++;
    }
    return count > 0 ? Math.round(sum / count) : 0;
  }

  return (
    <div className="space-y-3">
      {/* ── Desktop: full 8-column grid ── */}
      <div className="hidden overflow-x-auto sm:block">
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
                    className={cn("flex-1 rounded-sm h-6", getCellColor(pct))}
                    title={`${label} ${h}:00 - ${pct}%`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: condensed 4-column time blocks ── */}
      <div className="block sm:hidden">
        {/* Block labels */}
        <div className="flex">
          <div className="w-10 shrink-0" />
          {TIME_BLOCKS.map((block) => (
            <div
              key={block.label}
              className="flex-1 text-center text-[10px] text-muted-foreground"
            >
              {block.label}
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {DOW_LABELS.map((label, dow) => (
          <div key={label} className="flex items-center gap-0.5">
            <div className="w-10 shrink-0 text-xs text-muted-foreground">
              {label}
            </div>
            {TIME_BLOCKS.map((block) => {
              const pct = getBlockPct(dow, block.hours);
              return (
                <div
                  key={block.label}
                  className={cn("flex-1 rounded-sm h-6", getCellColor(pct))}
                  title={`${label} ${block.label} - ${pct}%`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-muted" /> 0%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary/15" />{" "}
          1-25%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary/30" />{" "}
          25-50%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary/60" />{" "}
          50-75%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary" /> 75%+
        </span>
      </div>
    </div>
  );
}
