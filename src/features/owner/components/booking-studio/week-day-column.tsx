"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type RangeSelectionConfig,
  RangeSelectionProvider,
} from "@/shared/components/kudos/range-selection";
import {
  buildOpenCellIndexSet,
  type CourtHoursWindow,
  getDayOfWeekForDayKey,
  getWindowsForDayOfWeek,
} from "./court-hours";
import { DraftTimelineBlock } from "./draft-row-card";
import { SelectableTimelineRow } from "./selectable-timeline-row";
import { TimelineBlockItem } from "./timeline-block-item";
import { TimelineReservationItem } from "./timeline-reservation-item";
import type { CourtBlockItem, DraftRowItem, ReservationItem } from "./types";
import { getMinuteOfDay } from "./types";

export const WeekDayColumn = React.memo(function WeekDayColumn({
  dayKey,
  hours,
  blocks,
  draftBlocks,
  reservations,
  timeZone,
  disabled,
  isPastDay,
  courtHoursWindows,
  pendingBlockIds,
  onRemoveBlock,
  onConvertWalkIn,
  placing,
  onPlace,
  onResizePreview,
  onResizeCommit,
  committedRange,
  onCommitRange,
}: {
  dayKey: string;
  hours: number[];
  blocks: Array<{ block: CourtBlockItem; topOffset: number; height: number }>;
  draftBlocks: Array<{
    row: DraftRowItem;
    topOffset: number;
    height: number;
  }>;
  reservations: Array<{
    reservation: ReservationItem;
    topOffset: number;
    height: number;
  }>;
  timeZone: string;
  disabled: boolean;
  isPastDay?: boolean;
  courtHoursWindows?: CourtHoursWindow[];
  pendingBlockIds: Set<string>;
  onRemoveBlock?: (blockId: string) => void;
  onConvertWalkIn?: (blockId: string) => void;
  placing?: boolean;
  onPlace?: (dayKey: string, startMinute: number) => void;
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
  committedRange: { startIdx: number; endIdx: number } | null;
  onCommitRange: (dayKey: string, startIdx: number, endIdx: number) => void;
}) {
  const startHour = hours[0] ?? 0;

  const selectionConfig = React.useMemo<RangeSelectionConfig>(() => {
    const blockedHourIndices = new Set<number>();
    for (const { block } of blocks) {
      const blockStart = getMinuteOfDay(block.startTime, timeZone);
      const blockEnd = getMinuteOfDay(block.endTime, timeZone);
      for (let m = blockStart; m < blockEnd; m += 60) {
        const idx = Math.floor(m / 60) - startHour;
        if (idx >= 0 && idx < hours.length) {
          blockedHourIndices.add(idx);
        }
      }
    }
    for (const { reservation } of reservations) {
      const resStart = getMinuteOfDay(reservation.startTime, timeZone);
      const resEnd = getMinuteOfDay(reservation.endTime, timeZone);
      for (let m = resStart; m < resEnd; m += 60) {
        const idx = Math.floor(m / 60) - startHour;
        if (idx >= 0 && idx < hours.length) {
          blockedHourIndices.add(idx);
        }
      }
    }

    const closedHourIndices = new Set<number>();
    if (courtHoursWindows && courtHoursWindows.length > 0) {
      const dayOfWeek = getDayOfWeekForDayKey(dayKey, timeZone);
      const dayWindows = getWindowsForDayOfWeek(courtHoursWindows, dayOfWeek);
      const openCellIndices = buildOpenCellIndexSet({
        windowsForDay: dayWindows,
        axisStartHour: startHour,
        cellCount: hours.length,
        snapMinutes: 60,
      });

      for (let i = 0; i < hours.length; i += 1) {
        if (!openCellIndices.has(i)) {
          closedHourIndices.add(i);
        }
      }
    }

    const isUnavailable = (idx: number) =>
      blockedHourIndices.has(idx) || closedHourIndices.has(idx);

    return {
      isCellAvailable: (idx: number) =>
        idx >= 0 && idx < hours.length && !isUnavailable(idx),
      computeRange: (anchorIdx: number, targetIdx: number) => {
        const lo = Math.min(anchorIdx, targetIdx);
        const hi = Math.max(anchorIdx, targetIdx);
        for (let i = lo; i <= hi; i++) {
          if (isUnavailable(i)) return null;
        }
        return { startIdx: lo, endIdx: hi };
      },
      clampToContiguous: (anchorIdx: number, targetIdx: number) => {
        const dir = targetIdx >= anchorIdx ? 1 : -1;
        let current = anchorIdx;
        while (current !== targetIdx) {
          const next = current + dir;
          if (isUnavailable(next)) break;
          current = next;
        }
        return current;
      },
      commitRange: (s: number, e: number) => {
        onCommitRange(dayKey, s, e);
      },
    };
  }, [
    blocks,
    courtHoursWindows,
    dayKey,
    hours,
    onCommitRange,
    reservations,
    startHour,
    timeZone,
  ]);

  return (
    <RangeSelectionProvider
      config={selectionConfig}
      committedRange={committedRange}
    >
      <div
        className={cn(
          "relative border-l border-border/70",
          isPastDay && "bg-muted/40",
        )}
      >
        <div className="space-y-0">
          {hours.map((hour, hourIndex) => (
            <SelectableTimelineRow
              key={`week-cell-${dayKey}-${hour}`}
              dayKey={dayKey}
              startMinute={hour * 60}
              disabled={disabled}
              cellIndex={hourIndex}
              placing={placing}
              onPlace={onPlace}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0">
          {blocks.map(({ block, topOffset, height }) => (
            <TimelineBlockItem
              key={block.id}
              block={block}
              topOffset={topOffset}
              height={height}
              timeZone={timeZone}
              disabled={disabled}
              isPending={pendingBlockIds.has(block.id)}
              isPastDay={isPastDay}
              compact
              onRemove={onRemoveBlock}
              onConvertWalkIn={
                block.type === "WALK_IN" && onConvertWalkIn
                  ? onConvertWalkIn
                  : undefined
              }
              onResizePreview={
                (block.type === "WALK_IN" || block.type === "MAINTENANCE") &&
                onResizePreview
                  ? onResizePreview
                  : undefined
              }
              onResizeCommit={
                (block.type === "WALK_IN" || block.type === "MAINTENANCE") &&
                onResizeCommit
                  ? onResizeCommit
                  : undefined
              }
            />
          ))}
          {draftBlocks.map(({ row, topOffset, height }) => (
            <DraftTimelineBlock
              key={`draft-${row.id}`}
              row={row}
              topOffset={topOffset}
              height={height}
              timeZone={timeZone}
            />
          ))}
          {reservations.map(({ reservation, topOffset, height }) => (
            <TimelineReservationItem
              key={`res-${reservation.id}`}
              reservation={reservation}
              topOffset={topOffset}
              height={height}
              timeZone={timeZone}
              compact
            />
          ))}
        </div>
      </div>
    </RangeSelectionProvider>
  );
});
