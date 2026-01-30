"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TIMELINE_ROW_HEIGHT } from "./types";

export const ResizeHandle = React.memo(function ResizeHandle({
  blockId,
  edge,
  disabled,
  startTime,
  endTime,
  onPreview,
  onCommit,
}: {
  blockId: string;
  edge: "start" | "end";
  disabled: boolean;
  startTime: Date | string;
  endTime: Date | string;
  onPreview?: (args: {
    blockId: string;
    edge: "start" | "end";
    hoursDelta: number;
    baseStart: Date;
    baseEnd: Date;
  }) => void;
  onCommit?: (args: {
    blockId: string;
    edge: "start" | "end";
    hoursDelta: number;
    baseStart: Date;
    baseEnd: Date;
  }) => void;
}) {
  const dragRef = React.useRef<{
    pointerId: number;
    startY: number;
    baseStart: Date;
    baseEnd: Date;
  } | null>(null);
  const lastHoursDeltaRef = React.useRef<number>(0);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startY: e.clientY,
        baseStart: new Date(startTime),
        baseEnd: new Date(endTime),
      };
      lastHoursDeltaRef.current = 0;
    },
    [disabled, endTime, startTime],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragRef.current;
      if (!state) return;
      if (e.pointerId !== state.pointerId) return;

      const hoursDelta = Math.round(
        (e.clientY - state.startY) / TIMELINE_ROW_HEIGHT,
      );
      if (hoursDelta === lastHoursDeltaRef.current) return;
      lastHoursDeltaRef.current = hoursDelta;

      onPreview?.({
        blockId,
        edge,
        hoursDelta,
        baseStart: state.baseStart,
        baseEnd: state.baseEnd,
      });
    },
    [blockId, edge, onPreview],
  );

  const finishDrag = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragRef.current;
      if (!state) return;
      if (e.pointerId !== state.pointerId) return;

      const hoursDelta = lastHoursDeltaRef.current;
      dragRef.current = null;
      lastHoursDeltaRef.current = 0;
      e.currentTarget.releasePointerCapture(e.pointerId);

      if (hoursDelta === 0) return;

      onCommit?.({
        blockId,
        edge,
        hoursDelta,
        baseStart: state.baseStart,
        baseEnd: state.baseEnd,
      });
    },
    [blockId, edge, onCommit],
  );

  if (!onPreview && !onCommit) return null;

  return (
    <div
      className={cn(
        "absolute left-2 right-2 h-3 rounded-full transition-opacity",
        "lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100",
        "bg-foreground/20 hover:bg-foreground/40",
        edge === "start" ? "top-1" : "bottom-1",
        disabled ? "cursor-not-allowed" : "cursor-ns-resize",
        "touch-none",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    />
  );
});
