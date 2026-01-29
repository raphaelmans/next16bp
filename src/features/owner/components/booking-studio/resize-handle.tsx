"use client";

import { useDraggable } from "@dnd-kit/core";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { DragResizeHandle } from "./types";

export const ResizeHandle = React.memo(function ResizeHandle({
  blockId,
  edge,
  disabled,
}: {
  blockId: string;
  edge: "start" | "end";
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resize-${edge}-${blockId}`,
    data: { kind: "resize", blockId, edge } satisfies DragResizeHandle,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "absolute left-2 right-2 h-3 rounded-full transition-opacity",
        "lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100",
        "bg-foreground/20 hover:bg-foreground/40",
        edge === "start" ? "top-1" : "bottom-1",
        disabled ? "cursor-not-allowed" : "cursor-ns-resize",
        isDragging && "opacity-60",
      )}
      aria-hidden
    />
  );
});
