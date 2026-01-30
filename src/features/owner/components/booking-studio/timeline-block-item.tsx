"use client";

import { X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration, formatTimeRangeInTimeZone } from "@/shared/lib/format";
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
  onRemove,
  isImported,
  onReplaceWithGuest,
  onConvertWalkIn,
  onResizePreview,
  onResizeCommit,
}: {
  block: CourtBlockItem;
  topOffset: number;
  height: number;
  timeZone: string;
  disabled: boolean;
  isPending?: boolean;
  isPastDay?: boolean;
  compact?: boolean;
  onRemove?: (blockId: string) => void;
  isImported?: boolean;
  onReplaceWithGuest?: (blockId: string) => void;
  onConvertWalkIn?: (blockId: string) => void;
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
    <div
      style={{ top: topOffset, height }}
      className={cn(
        "pointer-events-auto absolute rounded-lg border bg-card text-card-foreground shadow-sm",
        compact
          ? "left-0.5 right-0.5 border-l-2 px-1 py-0.5"
          : "left-1 right-1 border-l-4 px-3 py-2",
        isWalkIn ? "border-l-primary" : "border-l-amber-500",
        "group",
        effectiveDisabled ? "cursor-not-allowed" : "cursor-default",
        isPending && "opacity-80",
        isPastDay && "opacity-50 saturate-50",
      )}
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
      {isImported && !compact && (
        <div className="mt-1 flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Imported
          </Badge>
          {onReplaceWithGuest && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-5 text-[10px] px-1.5"
              onPointerDownCapture={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onReplaceWithGuest(block.id);
              }}
            >
              Replace with guest
            </Button>
          )}
        </div>
      )}
      {isWalkIn && onConvertWalkIn && (
        <div className="mt-1">
          {compact ? (
            <Button
              type="button"
              variant="outline"
              className="h-4 rounded-full border-primary/30 bg-primary/5 px-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-primary/70 hover:bg-primary/10 hover:text-primary"
              onPointerDownCapture={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onConvertWalkIn(block.id);
              }}
              aria-label="Convert to guest"
            >
              Guest
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-5 text-[10px] px-1.5"
              onPointerDownCapture={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onConvertWalkIn(block.id);
              }}
            >
              Convert to guest
            </Button>
          )}
        </div>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove block"
          className={cn(
            "pointer-events-auto absolute z-10 flex items-center justify-center rounded-full",
            "bg-destructive/90 text-destructive-foreground shadow-sm",
            "lg:opacity-0 lg:group-hover:opacity-100 group-focus-within:opacity-100",
            "transition-opacity duration-150",
            "hover:bg-destructive",
            compact ? "-right-1.5 -top-1.5 h-4 w-4" : "-right-2 -top-2 h-5 w-5",
          )}
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(block.id);
          }}
        >
          <X className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </button>
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
