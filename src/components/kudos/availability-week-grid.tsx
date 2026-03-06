"use client";

import { Check } from "lucide-react";
import * as React from "react";
import { useShallow } from "zustand/shallow";
import {
  formatCurrency,
  formatCurrencyWhole,
  formatInTimeZone,
  formatTimeInTimeZone,
} from "@/common/format";
import { useNowMs } from "@/common/hooks/use-now";
import { getZonedDayRangeFromDayKey } from "@/common/time-zone";
import { cn } from "@/lib/utils";
import {
  deriveIsAwaitingEndClick,
  type RangeSelectionConfig,
  RangeSelectionProvider,
  selectActiveEndIdx,
  selectActiveStartIdx,
  useCellState,
  useRangeSelection,
} from "./range-selection";
import type { TimeSlot } from "./time-slot-picker";
import {
  buildWeekGridHourModel,
  deriveWeekGridCommittedRange,
  toWeekGridLinearIndex,
} from "./week-grid-domain";
import {
  getHourFromSlot,
  isSlotAvailable,
  isSlotSelectable,
  MAX_SLOT_COUNT,
  TIMELINE_SLOT_DURATION,
} from "./week-grid-utils";

export { getHourFromSlot, isSlotAvailable, isSlotSelectable };

const WEEK_ROW_HEIGHT = 56;
const COMPACT_ROW_HEIGHT = 48;

const parseDayKeyToDate = (dayKey: string, timeZone?: string) =>
  getZonedDayRangeFromDayKey(dayKey, timeZone).start;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AvailabilityWeekGridRange = {
  startTime: string;
  durationMinutes: number;
};

export type AvailabilityWeekGridCueMode = "none" | "highlight-anchor";

export type WeekGridDayCueState = "none" | "anchor";

type WeekGridDayCueInput = {
  dayKey: string;
  sameDayAnchorDayKey?: string;
  cueMode: AvailabilityWeekGridCueMode;
};

export function getWeekGridDayCueState({
  dayKey,
  sameDayAnchorDayKey,
  cueMode,
}: WeekGridDayCueInput): WeekGridDayCueState {
  if (cueMode !== "highlight-anchor") return "none";
  if (!sameDayAnchorDayKey) return "none";
  return dayKey === sameDayAnchorDayKey ? "anchor" : "none";
}

export type AvailabilityWeekGridProps = {
  dayKeys: string[];
  slotsByDay: Map<string, TimeSlot[]>;
  timeZone: string;
  selectedRange?: AvailabilityWeekGridRange;
  onRangeChange: (range: AvailabilityWeekGridRange) => void;
  onDayClick: (dayKey: string) => void;
  todayDayKey: string;
  maxDayKey: string;
  sameDayAnchorDayKey?: string;
  sameDayCueMode?: AvailabilityWeekGridCueMode;
  cartedStartTimes?: Set<string>;
  compact?: boolean;
};

// ---------------------------------------------------------------------------
// Summary Bar (subscribes to store)
// ---------------------------------------------------------------------------

interface WeekGridSummaryBarProps {
  allHours: number[];
  slotLookup: Map<string, Map<number, TimeSlot>>;
  dayKeys: string[];
  hoursPerDay: number;
  timeZone: string;
  onRangeChange: (range: AvailabilityWeekGridRange) => void;
  compact?: boolean;
}

const WeekGridSummaryBar = React.memo(function WeekGridSummaryBar({
  allHours,
  slotLookup,
  dayKeys,
  hoursPerDay,
  timeZone,
  onRangeChange,
  compact,
}: WeekGridSummaryBarProps) {
  const activeStartIdx = useRangeSelection(selectActiveStartIdx);
  const activeEndIdx = useRangeSelection(selectActiveEndIdx);
  const isAwaitingEndClick = useRangeSelection((s) =>
    deriveIsAwaitingEndClick(s),
  );

  // Derive display data outside selector to avoid closing over props
  const summaryData = React.useMemo(() => {
    if (activeStartIdx === null || activeEndIdx === null) return null;
    const startIdx = activeStartIdx;
    const endIdx = activeEndIdx;

    const startDayIdx = Math.floor(startIdx / hoursPerDay);
    const startHourIdx = startIdx % hoursPerDay;
    const endDayIdx = Math.floor(endIdx / hoursPerDay);
    const endHourIdx = endIdx % hoursPerDay;

    const startDk = dayKeys[startDayIdx];
    const startHourMap = slotLookup.get(startDk);
    if (!startHourMap) return null;

    const endDk = dayKeys[endDayIdx];
    const endHourMap = slotLookup.get(endDk);
    if (!endHourMap) return null;

    const startSlot = startHourMap.get(allHours[startHourIdx]);
    const endSlot = endHourMap.get(allHours[endHourIdx]);
    if (!startSlot || !endSlot) return null;

    let total = 0;
    let allHavePrice = true;
    for (let i = startIdx; i <= endIdx; i++) {
      const di = Math.floor(i / hoursPerDay);
      const hi = i % hoursPerDay;
      const dk = dayKeys[di];
      const hourMap = dk ? slotLookup.get(dk) : undefined;
      const slot = hourMap?.get(allHours[hi]);
      if (slot?.priceCents !== undefined) {
        total += slot.priceCents as number;
      } else {
        allHavePrice = false;
      }
    }

    const slotCount = endIdx - startIdx + 1;

    return {
      startTime: startSlot.startTime,
      endTime: endSlot.endTime,
      isAwaitingEndClick,
      priceCents: allHavePrice ? total : undefined,
      currency: startSlot.currency ?? "PHP",
      slotCount,
      durationHours: slotCount * (TIMELINE_SLOT_DURATION / 60),
    };
  }, [
    activeStartIdx,
    activeEndIdx,
    isAwaitingEndClick,
    hoursPerDay,
    dayKeys,
    slotLookup,
    allHours,
  ]);

  if (!summaryData) return null;

  return (
    <div className="overflow-hidden animate-in fade-in duration-150">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between rounded-xl border border-primary/20 bg-primary/5",
          compact ? "gap-2 px-3 py-2.5" : "gap-3 px-4 py-3",
        )}
      >
        <div className={cn("flex items-center", compact ? "gap-2" : "gap-3")}>
          <div
            className={cn(
              "shrink-0 items-center justify-center rounded-lg bg-primary/10",
              compact ? "flex h-6 w-6" : "flex h-8 w-8",
            )}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-foreground">
              {formatTimeInTimeZone(summaryData.startTime, timeZone)}
              {" \u2013 "}
              {formatTimeInTimeZone(summaryData.endTime, timeZone)}
            </p>
            <p className="text-xs text-muted-foreground">
              {summaryData.durationHours}h
              {summaryData.isAwaitingEndClick &&
                (compact
                  ? " \u00B7 Tap to extend"
                  : " \u00B7 Click another slot to extend")}
              {summaryData.priceCents !== undefined &&
                ` \u00B7 ${formatCurrency(summaryData.priceCents, summaryData.currency)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRangeChange({ startTime: "", durationMinutes: 0 })}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Grid Cell (memoized, subscribes to own visual state)
// ---------------------------------------------------------------------------

interface WeekGridCellProps {
  linearIdx: number;
  slot: TimeSlot | undefined;
  dayKey: string;
  hourIdx: number;
  isDisabled: boolean;
  timeZone: string;
  isInCart: boolean;
  compact?: boolean;
}

const WeekGridCell = React.memo(function WeekGridCell({
  linearIdx,
  slot,
  dayKey,
  hourIdx,
  isDisabled,
  timeZone,
  isInCart,
  compact,
}: WeekGridCellProps) {
  const { inRange, isStart, isEnd, inHoverPreview, isPendingStart } =
    useCellState(linearIdx);

  const { pointerDown, pointerEnter, click, setHoveredIdx } = useRangeSelection(
    useShallow((s) => ({
      pointerDown: s.pointerDown,
      pointerEnter: s.pointerEnter,
      click: s.click,
      setHoveredIdx: s.setHoveredIdx,
    })),
  );

  const available = slot ? isSlotAvailable(slot) : false;
  const canSelect = Boolean(slot && available && !isDisabled);
  const isBooked = slot?.status === "booked" || slot?.status === "held";
  const isMaintenance = slot?.unavailableReason === "MAINTENANCE";
  const isReserved = isBooked && !isMaintenance;

  return (
    <button
      key={`${dayKey}-${hourIdx}`}
      type="button"
      disabled={isDisabled || !available}
      tabIndex={available && !isDisabled ? 0 : -1}
      aria-pressed={inRange}
      aria-label={
        slot
          ? `${formatInTimeZone(new Date(slot.startTime), timeZone, "h a")}${!available ? " (unavailable)" : ""}`
          : undefined
      }
      onPointerDown={(e) => {
        e.preventDefault();
        if (slot && available && !isDisabled) {
          pointerDown(linearIdx, {
            clientX: e.clientX,
            clientY: e.clientY,
            pointerType: e.pointerType,
          });
        }
      }}
      onPointerEnter={(e) => {
        if (!isDisabled) {
          pointerEnter(linearIdx, {
            clientX: e.clientX,
            clientY: e.clientY,
            pointerType: e.pointerType,
          });
          if (available) setHoveredIdx(linearIdx);
        }
      }}
      onPointerLeave={() => setHoveredIdx(null)}
      onClick={(e) => {
        if (slot && available && !isDisabled) click(linearIdx, e.shiftKey);
      }}
      onKeyDown={(e) => {
        if (
          (e.key === "Enter" || e.key === " ") &&
          slot &&
          available &&
          !isDisabled
        ) {
          e.preventDefault();
          click(linearIdx, e.shiftKey);
        }
      }}
      className={cn(
        "group/cell relative flex w-full items-center justify-center border-t border-border/50 transition-all duration-150",
        compact ? "touch-pan-y" : "touch-none",
        canSelect &&
          !inRange &&
          !inHoverPreview &&
          !isInCart &&
          "cursor-pointer bg-success-light/20 hover:bg-success-light/50",
        isInCart &&
          !inRange &&
          "bg-success/10 ring-1 ring-inset ring-success/40 cursor-pointer",
        canSelect && inHoverPreview && "bg-primary/5 cursor-pointer",
        inRange && !isPendingStart && "bg-primary/8",
        isPendingStart && "bg-primary/15 ring-1 ring-inset ring-primary/25",
        isReserved && "bg-destructive-light/40",
        isMaintenance && "bg-warning-light/50",
        isDisabled && "cursor-not-allowed bg-muted/40",
        !slot && "bg-transparent",
      )}
      style={{ height: compact ? COMPACT_ROW_HEIGHT : WEEK_ROW_HEIGHT }}
    >
      {/* Left accent bar for selected range */}
      {inRange && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 bg-primary origin-top animate-in fade-in duration-150",
            isStart && "rounded-tl",
            isEnd && "rounded-bl",
          )}
        />
      )}

      {isReserved && !compact && (
        <span className="text-xs font-medium text-destructive/50">Booked</span>
      )}
      {isMaintenance && !compact && (
        <span className="text-xs font-medium text-warning-foreground/60">
          Maint.
        </span>
      )}
      {inRange && (
        <div className="flex flex-col items-center gap-0.5">
          <div
            className={cn(
              "h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/25 animate-in zoom-in-50 duration-150",
              isPendingStart &&
                "h-2.5 w-2.5 ring-2 ring-primary/20 animate-pulse",
            )}
          />
          {slot?.priceCents !== undefined && (
            <span
              className={cn(
                "font-medium tabular-nums text-primary/70",
                compact ? "max-w-full truncate text-[11px]" : "text-xs",
              )}
            >
              {formatCurrencyWhole(slot.priceCents, slot.currency ?? "PHP")}
            </span>
          )}
        </div>
      )}
      {isInCart && !inRange && slot && (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-success/20">
            <Check className="h-2.5 w-2.5 text-success" />
          </div>
          {slot.priceCents !== undefined && (
            <span
              className={cn(
                "font-medium tabular-nums text-success/80",
                compact ? "max-w-full truncate text-[11px]" : "text-xs",
              )}
            >
              {formatCurrencyWhole(slot.priceCents, slot.currency ?? "PHP")}
            </span>
          )}
        </div>
      )}
      {available && !inRange && !isInCart && slot && (
        <div className="flex flex-col items-center gap-0.5">
          {slot.priceCents !== undefined ? (
            <span
              className={cn(
                "font-medium tabular-nums text-success/80 group-hover/cell:text-success",
                compact ? "max-w-full truncate text-[11px]" : "text-xs",
              )}
            >
              {formatCurrencyWhole(slot.priceCents, slot.currency ?? "PHP")}
            </span>
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-success/50 transition-transform group-hover/cell:scale-150 group-hover/cell:bg-success" />
          )}
        </div>
      )}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AvailabilityWeekGrid({
  dayKeys,
  slotsByDay,
  timeZone,
  selectedRange,
  onRangeChange,
  onDayClick,
  todayDayKey,
  maxDayKey,
  sameDayAnchorDayKey,
  sameDayCueMode = "none",
  cartedStartTimes,
  compact = false,
}: AvailabilityWeekGridProps) {
  const nowMs = useNowMs({ intervalMs: 10_000 });

  const { allHours, slotLookup, hoursPerDay } = React.useMemo(
    () => buildWeekGridHourModel(slotsByDay, timeZone, dayKeys),
    [dayKeys, slotsByDay, timeZone],
  );

  // Linear index mapping: linearIdx = dayColIndex * hoursPerDay + hourIdx
  const toLinear = React.useCallback(
    (dayColIdx: number, hourIdx: number) =>
      toWeekGridLinearIndex(dayColIdx, hourIdx, hoursPerDay),
    [hoursPerDay],
  );

  // Committed selection → linear indices
  const committedRange = React.useMemo(
    () =>
      deriveWeekGridCommittedRange({
        selectedRange,
        dayKeys,
        slotLookup,
        allHours,
        hoursPerDay,
        nowMs,
      }),
    [selectedRange, dayKeys, slotLookup, allHours, hoursPerDay, nowMs],
  );

  // Build config
  const config = React.useMemo<RangeSelectionConfig>(() => {
    const getDayHour = (idx: number) => ({
      dayColIdx: Math.floor(idx / hoursPerDay),
      hourIdx: idx % hoursPerDay,
    });

    const getSlotForLinearIdx = (idx: number): TimeSlot | undefined => {
      const { dayColIdx, hourIdx } = getDayHour(idx);
      const dk = dayKeys[dayColIdx];
      if (!dk) return undefined;
      const hourMap = slotLookup.get(dk);
      return hourMap?.get(allHours[hourIdx]);
    };

    return {
      isCellAvailable: (idx) => {
        const { dayColIdx, hourIdx } = getDayHour(idx);
        const dk = dayKeys[dayColIdx];
        if (!dk) return false;
        const hourMap = slotLookup.get(dk);
        const slot = hourMap?.get(allHours[hourIdx]);
        return slot ? isSlotSelectable(slot, nowMs) : false;
      },
      computeRange: (anchorIdx, targetIdx) => {
        const a = getDayHour(anchorIdx);
        const t = getDayHour(targetIdx);
        // Allow same day or adjacent day only
        if (Math.abs(a.dayColIdx - t.dayColIdx) > 1) return null;
        const lo = Math.min(anchorIdx, targetIdx);
        const hi = Math.max(anchorIdx, targetIdx);
        // Enforce 24-hour max range
        if (hi - lo + 1 > MAX_SLOT_COUNT) return null;
        for (let i = lo; i <= hi; i++) {
          const slot = getSlotForLinearIdx(i);
          if (!slot || !isSlotSelectable(slot, nowMs)) return null;
        }
        return { startIdx: lo, endIdx: hi };
      },
      clampToContiguous: (anchorIdx, targetIdx) => {
        const a = getDayHour(anchorIdx);
        const t = getDayHour(targetIdx);
        // Allow same day or adjacent day only
        if (Math.abs(a.dayColIdx - t.dayColIdx) > 1) return anchorIdx;
        const direction = targetIdx >= anchorIdx ? 1 : -1;
        let lastValid = anchorIdx;
        let i = anchorIdx + direction;
        while (direction > 0 ? i <= targetIdx : i >= targetIdx) {
          const slot = getSlotForLinearIdx(i);
          if (!slot || !isSlotSelectable(slot, nowMs)) break;
          lastValid = i;
          i += direction;
        }
        return lastValid;
      },
      commitRange: (startIdx, endIdx) => {
        const s = getDayHour(startIdx);
        const dk = dayKeys[s.dayColIdx];
        const hourMap = slotLookup.get(dk);
        if (!hourMap) return;
        const startSlot = hourMap.get(allHours[s.hourIdx]);
        if (!startSlot) return;
        const slotCount = endIdx - startIdx + 1;

        onRangeChange({
          startTime: startSlot.startTime,
          durationMinutes: slotCount * TIMELINE_SLOT_DURATION,
        });
      },
      onClear: () => {
        onRangeChange({ startTime: "", durationMinutes: 0 });
      },
    };
  }, [dayKeys, slotLookup, allHours, hoursPerDay, onRangeChange, nowMs]);

  const hasAnySlots = dayKeys.some(
    (dk) => (slotsByDay.get(dk)?.length ?? 0) > 0,
  );

  if (!hasAnySlots) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No availability this week.
      </p>
    );
  }

  return (
    <RangeSelectionProvider config={config} committedRange={committedRange}>
      <WeekGridInner
        dayKeys={dayKeys}
        allHours={allHours}
        slotLookup={slotLookup}
        hoursPerDay={hoursPerDay}
        timeZone={timeZone}
        onRangeChange={onRangeChange}
        onDayClick={onDayClick}
        todayDayKey={todayDayKey}
        maxDayKey={maxDayKey}
        sameDayAnchorDayKey={sameDayAnchorDayKey}
        sameDayCueMode={sameDayCueMode}
        toLinear={toLinear}
        nowMs={nowMs}
        cartedStartTimes={cartedStartTimes}
        compact={compact}
      />
    </RangeSelectionProvider>
  );
}

// ---------------------------------------------------------------------------
// Inner Grid (inside provider)
// ---------------------------------------------------------------------------

interface WeekGridInnerProps {
  dayKeys: string[];
  allHours: number[];
  slotLookup: Map<string, Map<number, TimeSlot>>;
  hoursPerDay: number;
  timeZone: string;
  onRangeChange: (range: AvailabilityWeekGridRange) => void;
  onDayClick: (dayKey: string) => void;
  todayDayKey: string;
  maxDayKey: string;
  sameDayAnchorDayKey?: string;
  sameDayCueMode: AvailabilityWeekGridCueMode;
  toLinear: (dayColIdx: number, hourIdx: number) => number;
  nowMs: number;
  cartedStartTimes?: Set<string>;
  compact?: boolean;
}

function WeekGridInner({
  dayKeys,
  allHours,
  slotLookup,
  hoursPerDay,
  timeZone,
  onRangeChange,
  onDayClick,
  todayDayKey,
  maxDayKey,
  sameDayAnchorDayKey,
  sameDayCueMode,
  toLinear,
  nowMs,
  cartedStartTimes,
  compact,
}: WeekGridInnerProps) {
  const { pointerUp, setHoveredIdx } = useRangeSelection(
    useShallow((s) => ({
      pointerUp: s.pointerUp,
      setHoveredIdx: s.setHoveredIdx,
    })),
  );
  const isDragging = useRangeSelection((s) => s.anchorIdx !== null);

  const refDayKey = dayKeys[0];
  const sameDayAnchorLabel = React.useMemo(() => {
    if (sameDayCueMode !== "highlight-anchor" || !sameDayAnchorDayKey) {
      return null;
    }
    const anchorDate = parseDayKeyToDate(sameDayAnchorDayKey, timeZone);
    return formatInTimeZone(anchorDate, timeZone, "EEE, MMM d");
  }, [sameDayAnchorDayKey, sameDayCueMode, timeZone]);
  const hasAnchorCue =
    sameDayCueMode === "highlight-anchor" && !!sameDayAnchorDayKey;

  return (
    <div
      className={cn("select-none", compact ? "space-y-2" : "space-y-3")}
      onPointerLeave={() => {
        if (isDragging) pointerUp();
        setHoveredIdx(null);
      }}
    >
      <WeekGridSummaryBar
        allHours={allHours}
        slotLookup={slotLookup}
        dayKeys={dayKeys}
        hoursPerDay={hoursPerDay}
        timeZone={timeZone}
        onRangeChange={onRangeChange}
        compact={compact}
      />

      {sameDayAnchorLabel ? (
        <div className="rounded-lg border border-success/35 bg-success-light/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Same-day booking:</span>{" "}
          add more courts on{" "}
          <span className="font-medium">{sameDayAnchorLabel}</span>.
        </div>
      ) : null}

      <div
        className={cn(
          compact
            ? "overflow-y-auto"
            : "overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory",
        )}
        style={compact ? { maxHeight: "calc(50vh - 80px)" } : undefined}
      >
        <div>
          {/* Day headers */}
          <div
            className="grid gap-x-0"
            style={{
              gridTemplateColumns: compact
                ? "36px repeat(7, 1fr)"
                : "48px repeat(7, 1fr)",
            }}
          >
            <div />
            {dayKeys.map((dk) => {
              const date = parseDayKeyToDate(dk, timeZone);
              const isToday = dk === todayDayKey;
              const isPast = dk < todayDayKey;
              const isBeyondMax = dk > maxDayKey;
              const dayCueState = getWeekGridDayCueState({
                dayKey: dk,
                sameDayAnchorDayKey,
                cueMode: sameDayCueMode,
              });
              const isAnchorCue = dayCueState === "anchor";

              const headerContent = (
                <>
                  <div
                    className={compact ? "text-[9px] leading-tight" : undefined}
                  >
                    {formatInTimeZone(
                      date,
                      timeZone,
                      compact ? "EEEEEE" : "EEE",
                    )}
                  </div>
                  <div
                    className={cn(
                      "font-heading font-bold",
                      compact ? "mt-0 text-xs" : "mt-0.5 text-base",
                      isToday &&
                        (compact
                          ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          : "inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground"),
                    )}
                  >
                    {formatInTimeZone(date, timeZone, "d")}
                  </div>
                </>
              );

              const sharedClasses = cn(
                compact
                  ? "border-b border-border/50 px-0.5 py-1.5 text-center text-[9px] font-semibold"
                  : "border-b border-border/70 px-1 py-2 text-center text-xs font-semibold transition-colors",
                isAnchorCue &&
                  !isPast &&
                  !isBeyondMax &&
                  "bg-success-light/60 text-success shadow-[inset_0_0_0_1px_hsl(var(--success)/0.45)]",
                hasAnchorCue &&
                  !isAnchorCue &&
                  !isPast &&
                  !isBeyondMax &&
                  "bg-muted/20",
                isToday && !isAnchorCue && "text-primary",
                isPast && "text-muted-foreground/40",
                isBeyondMax && "text-muted-foreground/40",
                !compact &&
                  !isPast &&
                  !isBeyondMax &&
                  (isAnchorCue
                    ? "hover:bg-success-light/70 cursor-pointer"
                    : hasAnchorCue
                      ? "hover:bg-muted/30 cursor-pointer"
                      : "hover:bg-primary/10 cursor-pointer"),
              );

              if (compact) {
                return (
                  <div key={`hdr-${dk}`} className={sharedClasses}>
                    {headerContent}
                  </div>
                );
              }

              return (
                <button
                  key={`hdr-${dk}`}
                  type="button"
                  onClick={() => onDayClick(dk)}
                  disabled={isPast || isBeyondMax}
                  className={sharedClasses}
                >
                  {headerContent}
                </button>
              );
            })}
          </div>

          {/* Hour rows */}
          <div
            className="grid gap-x-0"
            style={{
              gridTemplateColumns: compact
                ? "36px repeat(7, 1fr)"
                : "48px repeat(7, 1fr)",
            }}
          >
            <div>
              {allHours.map((hour) => {
                const refDate = parseDayKeyToDate(refDayKey, timeZone);
                const labelDate = new Date(
                  refDate.getTime() + (hour - refDate.getHours()) * 3600000,
                );
                return (
                  <div
                    key={`tlabel-${hour}`}
                    className={cn(
                      "flex items-start text-right font-mono",
                      compact
                        ? "pr-1.5 pt-0.5 text-[10px] text-muted-foreground/70"
                        : "pr-2 pt-1 text-xs text-muted-foreground",
                    )}
                    style={{
                      height: compact ? COMPACT_ROW_HEIGHT : WEEK_ROW_HEIGHT,
                    }}
                  >
                    <span className="w-full">
                      {formatInTimeZone(labelDate, timeZone, "h a")}
                    </span>
                  </div>
                );
              })}
            </div>

            {dayKeys.map((dk, dayColIdx) => {
              const isPast = dk < todayDayKey;
              const isBeyondMax = dk > maxDayKey;
              const isDayDisabled = isPast || isBeyondMax;
              const isToday = dk === todayDayKey;
              const dayCueState = getWeekGridDayCueState({
                dayKey: dk,
                sameDayAnchorDayKey,
                cueMode: sameDayCueMode,
              });
              const isAnchorCue = dayCueState === "anchor";
              const hourMap = slotLookup.get(dk);

              return (
                <div
                  key={`col-${dk}`}
                  className={cn(
                    "relative border-l",
                    compact ? "border-border/50" : "border-border/70",
                    isDayDisabled && "opacity-40",
                    isAnchorCue &&
                      !isDayDisabled &&
                      "bg-success-light/40 shadow-[inset_0_0_0_1px_hsl(var(--success)/0.30)]",
                    hasAnchorCue &&
                      !isAnchorCue &&
                      !isDayDisabled &&
                      "bg-muted/[0.06]",
                    isToday && !isAnchorCue && "bg-primary/[0.02]",
                  )}
                >
                  {allHours.map((hour, hourIdx) => {
                    const slot = hourMap?.get(hour);
                    const isPastSlot =
                      isToday && slot
                        ? Date.parse(slot.startTime) < nowMs
                        : false;
                    return (
                      <WeekGridCell
                        key={`${dk}-${hour}`}
                        linearIdx={toLinear(dayColIdx, hourIdx)}
                        slot={slot}
                        dayKey={dk}
                        hourIdx={hourIdx}
                        isDisabled={isDayDisabled || isPastSlot}
                        timeZone={timeZone}
                        isInCart={
                          slot?.startTime
                            ? (cartedStartTimes?.has(
                                String(Date.parse(slot.startTime)),
                              ) ?? false)
                            : false
                        }
                        compact={compact}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export type AvailabilityWeekGridSkeletonProps = {
  dayKeys: string[];
  timeZone: string;
  hours?: number[];
  compact?: boolean;
};

export function AvailabilityWeekGridSkeleton({
  dayKeys,
  timeZone,
  hours,
  compact,
}: AvailabilityWeekGridSkeletonProps) {
  const skeletonHours = hours ?? [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const rowHeight = compact ? COMPACT_ROW_HEIGHT : WEEK_ROW_HEIGHT;
  const colTemplate = compact ? "36px repeat(7, 1fr)" : "48px repeat(7, 1fr)";
  return (
    <div
      className={cn(
        compact ? "" : "overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0",
      )}
    >
      <div>
        <div
          className="grid gap-x-0"
          style={{ gridTemplateColumns: colTemplate }}
        >
          <div />
          {dayKeys.map((dk) => {
            const date = parseDayKeyToDate(dk, timeZone);
            return (
              <div
                key={`skel-hdr-${dk}`}
                className={cn(
                  "border-b border-border/70 text-center font-semibold",
                  compact
                    ? "px-0.5 py-1 text-[9px] leading-tight"
                    : "px-1 py-2 text-xs",
                )}
              >
                <div>
                  {formatInTimeZone(date, timeZone, compact ? "EEEEEE" : "EEE")}
                </div>
                <div
                  className={cn(
                    "font-heading font-bold",
                    compact ? "mt-0 text-xs" : "mt-0.5 text-base",
                  )}
                >
                  {formatInTimeZone(date, timeZone, "d")}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="grid gap-x-0"
          style={{ gridTemplateColumns: colTemplate }}
        >
          <div>
            {skeletonHours.map((h) => (
              <div
                key={`skel-t-${h}`}
                className={cn(
                  "flex items-start text-right text-muted-foreground font-mono",
                  compact ? "pr-1 pt-0.5 text-[10px]" : "pr-2 pt-1 text-xs",
                )}
                style={{ height: rowHeight }}
              >
                <span className="w-full">
                  {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
                </span>
              </div>
            ))}
          </div>
          {dayKeys.map((dk) => (
            <div key={`skel-col-${dk}`} className="border-l border-border/70">
              {skeletonHours.map((h) => (
                <div
                  key={`${dk}-${h}`}
                  className="border-t border-border/50"
                  style={{ height: rowHeight }}
                >
                  <div
                    className={cn(
                      "rounded bg-muted animate-pulse",
                      compact ? "mx-1 mt-1.5 h-3" : "mx-2 mt-2 h-4",
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
