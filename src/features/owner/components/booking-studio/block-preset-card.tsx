"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/shared/lib/format";
import type { BlockPreset, DragPreset } from "./types";

export const BlockPresetContent = React.memo(function BlockPresetContent({
  preset,
}: {
  preset: BlockPreset;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-sm font-heading font-semibold">{preset.label}</p>
        <p className="text-xs text-muted-foreground">{preset.description}</p>
      </div>
      <Badge variant={preset.badgeVariant}>
        {formatDuration(preset.durationMinutes)}
      </Badge>
    </div>
  );
});

export const BlockPresetPreview = React.memo(function BlockPresetPreview({
  preset,
}: {
  preset: BlockPreset;
}) {
  return (
    <div className="w-64 rounded-lg border bg-card p-3 text-left shadow-lg">
      <BlockPresetContent preset={preset} />
    </div>
  );
});

export const BlockPresetCard = React.memo(function BlockPresetCard({
  preset,
  disabled,
}: {
  preset: BlockPreset;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: preset.id,
      data: { kind: "preset", preset } satisfies DragPreset,
      disabled,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full rounded-lg border bg-card p-3 text-left transition-shadow",
        "hover:shadow-md",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-grab",
        isDragging ? "opacity-40" : "opacity-100",
      )}
      aria-disabled={disabled}
    >
      <BlockPresetContent preset={preset} />
    </button>
  );
});
