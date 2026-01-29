"use client";

import { useDroppable } from "@dnd-kit/core";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { TimelineCellData } from "./types";

export const TimelineDropRow = React.memo(function TimelineDropRow({
  dayKey,
  startMinute,
  disabled,
}: {
  dayKey: string;
  startMinute: number;
  disabled: boolean;
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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-[56px] rounded-md border-t border-border/70 transition-colors",
        "bg-card",
        isOver && !disabled && "ring-2 ring-primary/30 ring-inset bg-primary/5",
      )}
    />
  );
});
