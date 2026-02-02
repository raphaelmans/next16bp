"use client";

import { formatCurrency, formatDuration } from "@/common/format";
import { Badge } from "@/components/ui/badge";
import type { CourtBlockItem } from "./types";
import { getMinuteOfDay } from "./types";

export function BlockInfoDisplay({
  block,
  timeZone,
  isImported,
}: {
  block: CourtBlockItem;
  timeZone: string;
  isImported?: boolean;
}) {
  const isWalkIn = block.type === "WALK_IN";

  const durationMinutes = Math.max(
    getMinuteOfDay(block.endTime, timeZone) -
      getMinuteOfDay(block.startTime, timeZone),
    0,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge
          variant={isWalkIn ? "paid" : "warning"}
          className="text-[10px] px-1.5 py-0"
        >
          {isWalkIn ? "Walk-in" : "Maintenance"}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {formatDuration(durationMinutes)}
        </span>
      </div>
      {block.reason && (
        <p className="text-sm text-muted-foreground">{block.reason}</p>
      )}
      {isWalkIn && block.totalPriceCents > 0 && (
        <p className="text-sm font-medium">
          {formatCurrency(block.totalPriceCents, block.currency)}
        </p>
      )}
      {isImported && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          Imported
        </Badge>
      )}
    </div>
  );
}
