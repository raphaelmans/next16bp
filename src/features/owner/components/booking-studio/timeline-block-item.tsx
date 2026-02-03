"use client";

import * as React from "react";
import { formatDuration, formatTimeRangeInTimeZone } from "@/common/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ResizeHandle } from "./resize-handle";
import type { CourtBlockItem } from "./types";
import { getMinuteOfDay } from "./types";

export const TimelineBlockItem = React.memo(function TimelineBlockItem({
  block,
  topOffset,
  height,
  timeZone,
  disabled,
  isPending,
  isPastDay,
  compact,
  onResizePreview,
  onResizeCommit,
  onSelect,
}: {
  block: CourtBlockItem;
  topOffset: number;
  height: number;
  timeZone: string;
  disabled: boolean;
  isPending?: boolean;
  isPastDay?: boolean;
  compact?: boolean;
  onSelect?: (blockId: string) => void;
  onResizePreview?: (args: {
    blockId: string;
    edge: "start" | "end";
    hoursDelta: number;
    baseStart: Date;
    baseEnd: Date;
  }) => void;
  onResizeCommit?: (args: {
    blockId: string;
    edge: "start" | "end";
    hoursDelta: number;
    baseStart: Date;
    baseEnd: Date;
  }) => void;
}) {
  const effectiveDisabled = disabled;

  const canResize = Boolean(onResizePreview || onResizeCommit);

  const isWalkIn = block.type === "WALK_IN";
  const durationMinutes = Math.max(
    getMinuteOfDay(block.endTime, timeZone) -
      getMinuteOfDay(block.startTime, timeZone),
    0,
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: this block is conditionally interactive (role/tabIndex/keyboard handlers set) when selectable.
    <div
      style={{ top: topOffset, height }}
      className={cn(
        "pointer-events-auto absolute overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm",
        compact
          ? "left-0.5 right-0.5 border-l-2 px-1 py-0.5"
          : "left-1 right-1 border-l-4 px-3 py-2",
        isWalkIn ? "border-l-primary" : "border-l-amber-500",
        "group",
        effectiveDisabled ? "cursor-not-allowed" : "cursor-default",
        isPending && "opacity-80",
        isPastDay && "opacity-50 saturate-50",
        onSelect && "cursor-pointer",
      )}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? () => onSelect(block.id) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(block.id);
              }
            }
          : undefined
      }
    >
      <div
        className={cn(
          "flex items-center justify-between gap-1",
          compact ? "gap-0.5" : "gap-2",
        )}
      >
        {compact ? (
          <span
            className={cn(
              "text-[10px] font-semibold truncate",
              isWalkIn ? "text-primary" : "text-amber-600",
            )}
          >
            {isWalkIn ? "W" : "M"}
          </span>
        ) : (
          <Badge
            variant={isWalkIn ? "paid" : "warning"}
            className="text-[10px] px-1.5 py-0"
          >
            {isWalkIn ? "Walk-in" : "Maintenance"}
          </Badge>
        )}
        {!compact && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(durationMinutes)}
          </span>
        )}
      </div>
      {!compact && (
        <div className="mt-1 text-xs font-medium">
          {formatTimeRangeInTimeZone(block.startTime, block.endTime, timeZone)}
        </div>
      )}
      {compact && (
        <div className="text-[9px] text-muted-foreground truncate">
          {formatTimeRangeInTimeZone(block.startTime, block.endTime, timeZone)}
        </div>
      )}
      {!compact && block.reason && (
        <div className="text-[11px] text-muted-foreground truncate">
          {block.reason}
        </div>
      )}
      {canResize ? (
        <>
          <ResizeHandle
            blockId={block.id}
            edge="start"
            disabled={effectiveDisabled}
            startTime={block.startTime}
            endTime={block.endTime}
            onPreview={onResizePreview}
            onCommit={onResizeCommit}
          />
          <ResizeHandle
            blockId={block.id}
            edge="end"
            disabled={effectiveDisabled}
            startTime={block.startTime}
            endTime={block.endTime}
            onPreview={onResizePreview}
            onCommit={onResizeCommit}
          />
        </>
      ) : null}
    </div>
  );
});
