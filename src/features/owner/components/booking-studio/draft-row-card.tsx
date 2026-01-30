"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatTimeRangeInTimeZone } from "@/shared/lib/format";
import type { DraftRowItem, DraftRowStatus } from "./types";
import { DRAFT_STATUS_BADGE } from "./types";

export const DraftTimelineBlock = React.memo(function DraftTimelineBlock({
  row,
  topOffset,
  height,
  timeZone,
}: {
  row: DraftRowItem;
  topOffset: number;
  height: number;
  timeZone: string;
}) {
  const status = (row.status ?? "PENDING") as DraftRowStatus;
  const statusBadge = DRAFT_STATUS_BADGE[status] ?? "secondary";
  const startTime = row.startTime as Date | string | null;
  const endTime = row.endTime as Date | string | null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-2 right-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-foreground",
        status === "ERROR"
          ? "border-destructive/30"
          : status === "WARNING"
            ? "border-amber-400/30"
            : "border-primary/30",
      )}
      style={{ top: topOffset, height }}
    >
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase">
        <span>Draft · Row {row.lineNumber}</span>
        <Badge variant={statusBadge}>{status.toLowerCase()}</Badge>
      </div>
      {startTime && endTime ? (
        <div className="text-xs">
          {formatTimeRangeInTimeZone(startTime, endTime, timeZone)}
        </div>
      ) : null}
      {row.courtLabel ? (
        <div className="text-[11px] opacity-70 truncate">
          Court: {row.courtLabel}
        </div>
      ) : null}
    </div>
  );
});

export const DraftRowCard = React.memo(function DraftRowCard({
  row,
  timeZone,
  disabled,
  selectedCourt,
  isArmed,
  onArm,
}: {
  row: DraftRowItem;
  timeZone: string;
  disabled: boolean;
  selectedCourt: string | null;
  isArmed?: boolean;
  onArm?: (rowId: string) => void;
}) {
  const status = (row.status ?? "PENDING") as DraftRowStatus;
  const statusBadge = DRAFT_STATUS_BADGE[status] ?? "secondary";

  const startTime = row.startTime as Date | string | null;
  const endTime = row.endTime as Date | string | null;
  const timeLabel =
    startTime && endTime
      ? formatTimeRangeInTimeZone(startTime, endTime, timeZone)
      : "No time set";

  const errorHint = row.errors?.[0];

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "w-full rounded-lg border bg-card p-3 text-left text-xs transition-shadow",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:shadow-sm",
        isArmed &&
          "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20",
      )}
      onClick={() => {
        if (disabled) return;
        onArm?.(row.id);
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading font-semibold">Row {row.lineNumber}</span>
        <Badge variant={statusBadge}>{status.toLowerCase()}</Badge>
      </div>
      <p className="mt-1 text-muted-foreground">{timeLabel}</p>
      {row.courtLabel ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Court: {row.courtLabel}
        </p>
      ) : null}
      {!row.courtLabel && selectedCourt ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {isArmed ? "Tap a slot to place" : `Tap to place on ${selectedCourt}`}
        </p>
      ) : null}
      {errorHint ? (
        <p className="mt-1 text-[11px] text-destructive">{errorHint}</p>
      ) : null}
    </button>
  );
});
