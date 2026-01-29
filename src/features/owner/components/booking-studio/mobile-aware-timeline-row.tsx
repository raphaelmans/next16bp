"use client";

import { useDroppable } from "@dnd-kit/core";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  useCellState,
  useRangeSelection,
} from "@/shared/components/kudos/range-selection";
import type { TimelineCellData } from "./types";

export const MobileAwareTimelineRow = React.memo(
  function MobileAwareTimelineRow({
    dayKey,
    startMinute,
    disabled,
    cellIndex,
  }: {
    dayKey: string;
    startMinute: number;
    disabled: boolean;
    cellIndex: number;
  }) {
    const { setNodeRef, isOver } = useDroppable({
      id: `timeline-cell-${dayKey}-${startMinute}`,
      data: {
        kind: "timeline-cell",
        dayKey,
        startMinute,
      } satisfies TimelineCellData,
      disabled,
    });

    const cellState = useCellState(cellIndex);
    const pointerDown = useRangeSelection((s) => s.pointerDown);
    const pointerEnter = useRangeSelection((s) => s.pointerEnter);
    const click = useRangeSelection((s) => s.click);
    const setHoveredIdx = useRangeSelection((s) => s.setHoveredIdx);
    const isCellAvailable = useRangeSelection((s) => s.config.isCellAvailable);

    const isAvailable = !disabled && isCellAvailable(cellIndex);

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent) => {
        if (!isAvailable) return;
        e.preventDefault();
        pointerDown(cellIndex);
      },
      [cellIndex, isAvailable, pointerDown],
    );

    const handlePointerEnter = React.useCallback(() => {
      if (!isAvailable) return;
      pointerEnter(cellIndex);
      setHoveredIdx(cellIndex);
    }, [cellIndex, isAvailable, pointerEnter, setHoveredIdx]);

    const handlePointerLeave = React.useCallback(() => {
      setHoveredIdx(null);
    }, [setHoveredIdx]);

    const handleClick = React.useCallback(
      (e: React.MouseEvent) => {
        if (!isAvailable) return;
        click(cellIndex, e.shiftKey);
      },
      [cellIndex, click, isAvailable],
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isAvailable) click(cellIndex, e.shiftKey);
        }
      },
      [cellIndex, click, isAvailable],
    );

    return (
      <button
        type="button"
        ref={setNodeRef}
        tabIndex={isAvailable ? 0 : -1}
        aria-disabled={!isAvailable}
        className={cn(
          "block w-full h-[56px] rounded-md border-t border-border/70 transition-colors",
          "touch-none appearance-none",
          "bg-card",
          isOver &&
            !disabled &&
            "ring-2 ring-primary/30 ring-inset bg-primary/5",
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
      />
    );
  },
);
