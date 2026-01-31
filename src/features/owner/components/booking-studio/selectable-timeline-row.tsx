"use client";

import { Plus } from "lucide-react";
import * as React from "react";
import {
  useCellState,
  useRangeSelection,
} from "@/components/kudos/range-selection";
import { cn } from "@/lib/utils";

export const SelectableTimelineRow = React.memo(function SelectableTimelineRow({
  dayKey,
  startMinute,
  disabled,
  cellIndex,
  placing,
  onPlace,
}: {
  dayKey: string;
  startMinute: number;
  disabled: boolean;
  cellIndex: number;
  placing?: boolean;
  onPlace?: (dayKey: string, startMinute: number) => void;
}) {
  const cellState = useCellState(cellIndex);
  const pointerDown = useRangeSelection((s) => s.pointerDown);
  const pointerEnter = useRangeSelection((s) => s.pointerEnter);
  const click = useRangeSelection((s) => s.click);
  const setHoveredIdx = useRangeSelection((s) => s.setHoveredIdx);
  const isCellAvailable = useRangeSelection((s) => s.config.isCellAvailable);

  const isCellOpen = isCellAvailable(cellIndex);
  const isInteractive = !disabled && isCellOpen;

  const isPlacing = Boolean(placing && onPlace);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isInteractive) return;
      if (isPlacing) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      pointerDown(cellIndex);
    },
    [cellIndex, isInteractive, isPlacing, pointerDown],
  );

  const handlePointerEnter = React.useCallback(() => {
    if (!isInteractive) return;
    if (isPlacing) return;
    pointerEnter(cellIndex);
    setHoveredIdx(cellIndex);
  }, [cellIndex, isInteractive, isPlacing, pointerEnter, setHoveredIdx]);

  const handlePointerLeave = React.useCallback(() => {
    setHoveredIdx(null);
  }, [setHoveredIdx]);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isInteractive) return;
      if (isPlacing) {
        e.preventDefault();
        e.stopPropagation();
        onPlace?.(dayKey, startMinute);
        return;
      }
      click(cellIndex, e.shiftKey);
    },
    [cellIndex, click, dayKey, isInteractive, isPlacing, onPlace, startMinute],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isInteractive) click(cellIndex, e.shiftKey);
      }
    },
    [cellIndex, click, isInteractive],
  );

  const timeLabel = React.useMemo(() => {
    const h = Math.floor(startMinute / 60);
    const m = startMinute % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }, [startMinute]);

  return (
    <button
      type="button"
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
      className={cn(
        "group/cell relative block w-full h-[56px] rounded-md border-t border-border/70 transition-colors",
        "touch-none appearance-none",
        "bg-card",
        isInteractive &&
          "border-l-2 border-dashed border-l-primary/15 hover:bg-primary/10 hover:border-l-primary/30 cursor-pointer",
        !isInteractive && "bg-muted/30 cursor-not-allowed",
        isPlacing &&
          isInteractive &&
          "cursor-crosshair hover:bg-primary/5 hover:border-l-primary/40",
        cellState.inRange && "bg-primary/10",
        cellState.isStart && "rounded-t-lg ring-t-2 ring-primary/40",
        cellState.isEnd && "rounded-b-lg",
        cellState.inHoverPreview && "bg-primary/5",
        cellState.isPendingStart && "bg-primary/15 ring-2 ring-primary/30",
      )}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {isInteractive && (
        <span className="pointer-events-none absolute left-2 top-2 text-[10px] font-medium tabular-nums text-muted-foreground/70 md:hidden">
          {timeLabel}
        </span>
      )}
      {isInteractive && !cellState.inRange && !cellState.isPendingStart && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 opacity-0 transition-opacity md:group-hover/cell:opacity-100">
          <Plus className="size-3 text-primary/40" />
          <span className="text-[10px] font-medium tabular-nums text-primary/40">
            {timeLabel}
          </span>
        </span>
      )}
    </button>
  );
});
