"use client";

import { Info } from "lucide-react";
import * as React from "react";
import { useShallow } from "zustand/shallow";
import { formatInTimeZone } from "@/common/format";
import { getZonedDayRangeFromDayKey } from "@/common/time-zone";
import {
  type RangeSelectionConfig,
  RangeSelectionProvider,
  useCellState,
  useRangeSelection,
} from "@/components/kudos/range-selection";
import { cn } from "@/lib/utils";
import type { CourtHoursWindow } from "./court-hours";
import { DraftTimelineBlock } from "./draft-row-card";
import {
  buildOwnerSelectionConfig,
  dayToLinearIndex,
} from "./owner-week-grid-domain";
import { TimelineBlockItem } from "./timeline-block-item";
import { TimelineReservationItem } from "./timeline-reservation-item";
import type { CourtBlockItem, DraftRowItem, ReservationItem } from "./types";
import {
  buildDateFromDayKey,
  COMPACT_TIMELINE_ROW_HEIGHT,
  TIMELINE_ROW_HEIGHT,
} from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BlockSegment = {
  block: CourtBlockItem;
  topOffset: number;
  height: number;
};

type DraftSegment = {
  row: DraftRowItem;
  topOffset: number;
  height: number;
};

type ReservationSegment = {
  reservation: ReservationItem;
  topOffset: number;
  height: number;
};

type ResizeArgs = {
  blockId: string;
  edge: "start" | "end";
  hoursDelta: number;
  baseStart: Date;
  baseEnd: Date;
};

export type OwnerAvailabilityWeekGridProps = {
  weekDays: string[];
  hours: number[];
  timeZone: string;
  compact?: boolean;
  blocksByDay: Map<string, BlockSegment[]>;
  draftBlocksByDay: Map<string, DraftSegment[]>;
  reservationsByDay: Map<string, ReservationSegment[]>;
  courtHoursWindows?: CourtHoursWindow[];
  pendingBlockIds: Set<string>;
  onSelectBlock?: (blockId: string) => void;
  onSelectReservation?: (reservation: ReservationItem) => void;
  placing?: boolean;
  onPlace?: (dayKey: string, startMinute: number) => void;
  onResizePreview?: (args: ResizeArgs) => void;
  onResizeCommit?: (args: ResizeArgs) => void;
  committedRange: { startIdx: number; endIdx: number } | null;
  weekCommittedDayKey: string | null;
  weekCommittedEndDayKey: string | null;
  onCommitRange: (
    startDayKey: string,
    startHourIdx: number,
    endDayKey: string,
    endHourIdx: number,
  ) => void;
  onClearRange?: () => void;
  disabled?: boolean;
  todayDayKey: string;
  blocksLoading?: boolean;
};

// ---------------------------------------------------------------------------
// Tap-hold hint (mobile)
// ---------------------------------------------------------------------------

function TapHoldHint() {
  const hasSelection = useRangeSelection(
    (s) => s.committedRange !== null || s.anchorIdx !== null,
  );
  if (hasSelection) return null;
  return (
    <p className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground md:hidden">
      <Info className="h-3.5 w-3.5 shrink-0" />
      Tap and hold to select
    </p>
  );
}

// ---------------------------------------------------------------------------
// Grid Cell (memoized, subscribes to own visual state via linear index)
// ---------------------------------------------------------------------------

type OwnerWeekGridCellProps = {
  linearIdx: number;
  dayKey: string;
  startMinute: number;
  isInteractive: boolean;
  placing: boolean;
  onPlace?: (dayKey: string, startMinute: number) => void;
  compact: boolean;
};

const OwnerWeekGridCell = React.memo(function OwnerWeekGridCell({
  linearIdx,
  dayKey,
  startMinute,
  isInteractive,
  placing,
  onPlace,
  compact,
}: OwnerWeekGridCellProps) {
  const cellState = useCellState(linearIdx);
  const { pointerDown, pointerEnter, click, setHoveredIdx } = useRangeSelection(
    useShallow((s) => ({
      pointerDown: s.pointerDown,
      pointerEnter: s.pointerEnter,
      click: s.click,
      setHoveredIdx: s.setHoveredIdx,
    })),
  );

  const isPlacing = Boolean(placing && onPlace);
  const rowHeight = compact ? COMPACT_TIMELINE_ROW_HEIGHT : TIMELINE_ROW_HEIGHT;

  // Touch delay state
  const pendingRef = React.useRef<{
    timer: ReturnType<typeof setTimeout>;
    startX: number;
    startY: number;
  } | null>(null);

  const cancelPending = React.useCallback(() => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer);
      pendingRef.current = null;
    }
  }, []);

  React.useEffect(() => cancelPending, [cancelPending]);

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isInteractive) return;
      if (isPlacing) {
        e.preventDefault();
        return;
      }
      if (e.pointerType !== "touch") {
        e.preventDefault();
        pointerDown(linearIdx, {
          clientX: e.clientX,
          clientY: e.clientY,
          pointerType: e.pointerType,
        });
        return;
      }
      cancelPending();
      const timer = setTimeout(() => {
        pendingRef.current = null;
        pointerDown(linearIdx);
      }, 150);
      pendingRef.current = {
        timer,
        startX: e.clientX,
        startY: e.clientY,
      };
    },
    [linearIdx, isInteractive, isPlacing, pointerDown, cancelPending],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (pendingRef.current) {
        const dx = e.clientX - pendingRef.current.startX;
        const dy = e.clientY - pendingRef.current.startY;
        if (dx * dx + dy * dy > 100) {
          cancelPending();
        }
      }
    },
    [cancelPending],
  );

  const handlePointerEnter = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isInteractive || isPlacing) return;
      pointerEnter(linearIdx, {
        clientX: e.clientX,
        clientY: e.clientY,
        pointerType: e.pointerType,
      });
      setHoveredIdx(linearIdx);
    },
    [linearIdx, isInteractive, isPlacing, pointerEnter, setHoveredIdx],
  );

  const handlePointerLeave = React.useCallback(() => {
    cancelPending();
    setHoveredIdx(null);
  }, [cancelPending, setHoveredIdx]);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isInteractive) return;
      if (isPlacing) {
        e.preventDefault();
        e.stopPropagation();
        onPlace?.(dayKey, startMinute);
        return;
      }
      click(linearIdx, e.shiftKey);
    },
    [linearIdx, click, dayKey, isInteractive, isPlacing, onPlace, startMinute],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isInteractive) click(linearIdx, e.shiftKey);
      }
    },
    [linearIdx, click, isInteractive],
  );

  return (
    <button
      type="button"
      tabIndex={isInteractive ? 0 : -1}
      aria-disabled={!isInteractive}
      className={cn(
        "group/cell relative block w-full border-t border-border/50 transition-colors",
        compact ? "touch-pan-y" : "touch-none",
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
      style={{ height: rowHeight }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    />
  );
});

// ---------------------------------------------------------------------------
// Day overlay — blocks, drafts, reservations
// ---------------------------------------------------------------------------

type DayOverlayProps = {
  dayKey: string;
  blocks: BlockSegment[];
  draftBlocks: DraftSegment[];
  reservations: ReservationSegment[];
  timeZone: string;
  disabled: boolean;
  isPastDay: boolean;
  pendingBlockIds: Set<string>;
  onSelectBlock?: (blockId: string) => void;
  onSelectReservation?: (reservation: ReservationItem) => void;
  onResizePreview?: (args: ResizeArgs) => void;
  onResizeCommit?: (args: ResizeArgs) => void;
  compact: boolean;
};

const DayOverlay = React.memo(function DayOverlay({
  blocks,
  draftBlocks,
  reservations,
  timeZone,
  disabled,
  isPastDay,
  pendingBlockIds,
  onSelectBlock,
  onSelectReservation,
  onResizePreview,
  onResizeCommit,
  compact,
}: DayOverlayProps) {
  return (
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
          compact={compact}
          onSelect={onSelectBlock}
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
          compact={compact}
          onClick={
            onSelectReservation
              ? () => onSelectReservation(reservation)
              : undefined
          }
        />
      ))}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function OwnerAvailabilityWeekGrid({
  weekDays,
  hours,
  timeZone,
  compact = false,
  blocksByDay,
  draftBlocksByDay,
  reservationsByDay,
  courtHoursWindows,
  pendingBlockIds,
  onSelectBlock,
  onSelectReservation,
  placing = false,
  onPlace,
  onResizePreview,
  onResizeCommit,
  committedRange,
  weekCommittedDayKey,
  weekCommittedEndDayKey,
  onCommitRange,
  onClearRange,
  disabled = false,
  todayDayKey,
  blocksLoading = false,
}: OwnerAvailabilityWeekGridProps) {
  const hoursPerDay = hours.length;

  // Build the linear committed range from per-day range.
  // Handles cross-week overlap: when the committed start/end day key falls
  // outside the visible weekDays, clamp to the visible boundary so the
  // highlight remains visible for the overlapping portion.
  const linearCommittedRange = React.useMemo(() => {
    if (!committedRange || !weekCommittedDayKey) return null;

    const firstWeekDay = weekDays[0] ?? "";
    const lastWeekDay = weekDays[weekDays.length - 1] ?? "";
    const endDk = weekCommittedEndDayKey ?? weekCommittedDayKey;

    let startDayColIdx = weekDays.indexOf(weekCommittedDayKey);
    let endDayColIdx = weekDays.indexOf(endDk);
    let effectiveStartHourIdx = committedRange.startIdx;
    let effectiveEndHourIdx = committedRange.endIdx;

    // Cross-week: committed start is before visible week
    if (startDayColIdx === -1 && weekCommittedDayKey < firstWeekDay) {
      startDayColIdx = 0;
      effectiveStartHourIdx = 0;
    }

    // Cross-week: committed end is after visible week
    if (endDayColIdx === -1 && endDk > lastWeekDay) {
      endDayColIdx = weekDays.length - 1;
      effectiveEndHourIdx = hoursPerDay - 1;
    }

    if (startDayColIdx === -1 || endDayColIdx === -1) return null;

    return {
      startIdx: dayToLinearIndex(
        startDayColIdx,
        effectiveStartHourIdx,
        hoursPerDay,
      ),
      endIdx: dayToLinearIndex(endDayColIdx, effectiveEndHourIdx, hoursPerDay),
    };
  }, [
    committedRange,
    weekCommittedDayKey,
    weekCommittedEndDayKey,
    weekDays,
    hoursPerDay,
  ]);

  // Build selection config
  const config = React.useMemo<RangeSelectionConfig>(
    () =>
      buildOwnerSelectionConfig({
        weekDayKeys: weekDays,
        hours,
        timeZone,
        blocksByDay,
        reservationsByDay,
        courtHoursWindows: courtHoursWindows ?? [],
        compact,
        onCommitRange,
        onClear: onClearRange,
      }),
    [
      weekDays,
      hours,
      timeZone,
      blocksByDay,
      reservationsByDay,
      courtHoursWindows,
      compact,
      onCommitRange,
      onClearRange,
    ],
  );

  return (
    <RangeSelectionProvider
      config={config}
      committedRange={linearCommittedRange}
    >
      <OwnerWeekGridInner
        weekDays={weekDays}
        hours={hours}
        hoursPerDay={hoursPerDay}
        timeZone={timeZone}
        compact={compact}
        blocksByDay={blocksByDay}
        draftBlocksByDay={draftBlocksByDay}
        reservationsByDay={reservationsByDay}
        pendingBlockIds={pendingBlockIds}
        onSelectBlock={onSelectBlock}
        onSelectReservation={onSelectReservation}
        placing={placing}
        onPlace={onPlace}
        onResizePreview={onResizePreview}
        onResizeCommit={onResizeCommit}
        disabled={disabled}
        todayDayKey={todayDayKey}
        blocksLoading={blocksLoading}
      />
    </RangeSelectionProvider>
  );
}

// ---------------------------------------------------------------------------
// Inner Grid (inside provider)
// ---------------------------------------------------------------------------

type OwnerWeekGridInnerProps = {
  weekDays: string[];
  hours: number[];
  hoursPerDay: number;
  timeZone: string;
  compact: boolean;
  blocksByDay: Map<string, BlockSegment[]>;
  draftBlocksByDay: Map<string, DraftSegment[]>;
  reservationsByDay: Map<string, ReservationSegment[]>;
  pendingBlockIds: Set<string>;
  onSelectBlock?: (blockId: string) => void;
  onSelectReservation?: (reservation: ReservationItem) => void;
  placing: boolean;
  onPlace?: (dayKey: string, startMinute: number) => void;
  onResizePreview?: (args: ResizeArgs) => void;
  onResizeCommit?: (args: ResizeArgs) => void;
  disabled: boolean;
  todayDayKey: string;
  blocksLoading: boolean;
};

function OwnerWeekGridInner({
  weekDays,
  hours,
  hoursPerDay,
  timeZone,
  compact,
  blocksByDay,
  draftBlocksByDay,
  reservationsByDay,
  pendingBlockIds,
  onSelectBlock,
  onSelectReservation,
  placing,
  onPlace,
  onResizePreview,
  onResizeCommit,
  disabled,
  todayDayKey,
  blocksLoading,
}: OwnerWeekGridInnerProps) {
  const { pointerUp, setHoveredIdx } = useRangeSelection(
    useShallow((s) => ({
      pointerUp: s.pointerUp,
      setHoveredIdx: s.setHoveredIdx,
    })),
  );
  const isDragging = useRangeSelection((s) => s.anchorIdx !== null);
  const isCellAvailable = useRangeSelection((s) => s.config.isCellAvailable);

  const rowHeight = compact ? COMPACT_TIMELINE_ROW_HEIGHT : TIMELINE_ROW_HEIGHT;

  const refDayKey = weekDays[0] as string;

  return (
    <div
      className="select-none"
      onPointerLeave={() => {
        if (isDragging) pointerUp();
        setHoveredIdx(null);
      }}
    >
      <TapHoldHint />

      {/* Day headers */}
      <div
        className="grid gap-x-0"
        style={{
          gridTemplateColumns: compact
            ? "36px repeat(7, 1fr)"
            : "72px repeat(7, minmax(100px, 1fr))",
        }}
      >
        <div />
        {weekDays.map((dk) => {
          const wdStart = getZonedDayRangeFromDayKey(dk, timeZone).start;
          const isToday = dk === todayDayKey;
          const isPastDay = dk < todayDayKey;
          return (
            <div
              key={`header-${dk}`}
              className={cn(
                "border-b border-border/50 text-center font-semibold transition-colors",
                compact ? "px-0.5 py-1.5 text-[9px]" : "px-1 py-2 text-xs",
                isToday && "text-primary",
                isPastDay && "text-muted-foreground/60",
              )}
            >
              <div className={compact ? "text-[9px] leading-tight" : undefined}>
                {formatInTimeZone(
                  wdStart,
                  timeZone,
                  compact ? "EEEEEE" : "EEE",
                )}
              </div>
              <div
                className={cn(
                  "font-heading font-bold",
                  compact ? "mt-0 text-xs" : "mt-0.5 text-lg",
                  isToday &&
                    (compact
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : "inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"),
                )}
              >
                {formatInTimeZone(wdStart, timeZone, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hour rows */}
      <div
        className="grid gap-x-0"
        style={{
          gridTemplateColumns: compact
            ? "36px repeat(7, 1fr)"
            : "72px repeat(7, minmax(100px, 1fr))",
        }}
      >
        {/* Time labels */}
        <div>
          {hours.map((hour) => (
            <div
              key={`week-label-${hour}`}
              className={cn(
                "flex items-start font-mono text-right",
                compact
                  ? "pt-0.5 pr-1.5 text-[10px] text-muted-foreground/70"
                  : "pt-2 pr-2 text-xs text-muted-foreground",
              )}
              style={{ height: rowHeight }}
            >
              <span className="w-full">
                {formatInTimeZone(
                  buildDateFromDayKey(refDayKey, hour * 60, timeZone),
                  timeZone,
                  "h a",
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((dk, dayColIdx) => {
          const isPastDay = dk < todayDayKey;
          return (
            <div
              key={`col-${dk}`}
              className={cn(
                "relative border-l border-border/50",
                isPastDay && "bg-muted/40",
              )}
            >
              {hours.map((hour, hourIdx) => {
                const linearIdx = dayToLinearIndex(
                  dayColIdx,
                  hourIdx,
                  hoursPerDay,
                );
                return (
                  <OwnerWeekGridCell
                    key={`${dk}-${hour}`}
                    linearIdx={linearIdx}
                    dayKey={dk}
                    startMinute={hour * 60}
                    isInteractive={!disabled && isCellAvailable(linearIdx)}
                    placing={placing}
                    onPlace={onPlace}
                    compact={compact}
                  />
                );
              })}
              <DayOverlay
                dayKey={dk}
                blocks={blocksByDay.get(dk) ?? []}
                draftBlocks={draftBlocksByDay.get(dk) ?? []}
                reservations={reservationsByDay.get(dk) ?? []}
                timeZone={timeZone}
                disabled={disabled}
                isPastDay={isPastDay}
                pendingBlockIds={pendingBlockIds}
                onSelectBlock={onSelectBlock}
                onSelectReservation={onSelectReservation}
                onResizePreview={onResizePreview}
                onResizeCommit={onResizeCommit}
                compact={compact}
              />
              {blocksLoading && (
                <div className="absolute inset-0 animate-pulse bg-muted/50" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
