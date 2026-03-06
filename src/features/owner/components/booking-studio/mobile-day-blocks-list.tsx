"use client";

import * as React from "react";
import { formatCurrency, formatTimeRangeInTimeZone } from "@/common/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourtBlockItem } from "./types";

export const MobileDayBlocksList = React.memo(function MobileDayBlocksList({
  blocks,
  isLoading,
  timeZone,
  selectedDayLabel,
  onRemoveBlock,
  onConvertWalkIn,
  isCancelPending,
}: {
  blocks: CourtBlockItem[];
  isLoading: boolean;
  timeZone: string;
  selectedDayLabel: string;
  onRemoveBlock: (blockId: string) => void;
  onConvertWalkIn?: (blockId: string) => void;
  isCancelPending: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        <Separator />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3 pt-4">
      <Separator />
      <h3 className="text-sm font-heading font-semibold">
        Blocks · {selectedDayLabel}
      </h3>
      <div className="space-y-3 pb-20">
        {blocks.map((block) => (
          <div key={block.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Badge
                  variant={block.type === "WALK_IN" ? "warning" : "secondary"}
                >
                  {block.type === "WALK_IN" ? "Walk-in" : "Maintenance"}
                </Badge>
                <p className="text-sm font-medium">
                  {formatTimeRangeInTimeZone(
                    block.startTime,
                    block.endTime,
                    timeZone,
                  )}
                </p>
                {block.reason ? (
                  <p className="text-xs text-muted-foreground">
                    {block.reason}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                {block.type === "WALK_IN" ? (
                  <span className="text-sm font-semibold">
                    {formatCurrency(block.totalPriceCents, block.currency)}
                  </span>
                ) : null}
                {block.type === "WALK_IN" && onConvertWalkIn && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onConvertWalkIn(block.id)}
                  >
                    Guest
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveBlock(block.id)}
                  disabled={isCancelPending}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
