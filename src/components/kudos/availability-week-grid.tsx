"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { useShallow } from "zustand/shallow";
import {
  formatCurrency,
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

const TIMELINE_SLOT_DURATION = 60;
const WEEK_ROW_HEIGHT = 56;

const isSameInstant = (a: string, b: string): boolean => {
  const aMs = Date.parse(a);
  const bMs = Date.parse(b);
  if (Number.isFinite(aMs) && Number.isFinite(bMs)) {
    return aMs === bMs;
  }
  return a === b;
};

const parseDayKeyToDate = (dayKey: string, timeZone?: string) =>
  getZonedDayRangeFromDayKey(dayKey, timeZone).start;

const getHourFromSlot = (slot: TimeSlot, timeZone: string): number => {
  const d = new Date(slot.startTime);
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  }).formatToParts(d);
  const hourPart = parts.find((p) => p.type === "hour");
  return hourPart ? Number.parseInt(hourPart.value, 10) : 0;
};

function isSlotAvailable(slot: TimeSlot): boolean {
  return slot.status === "available";
}

function isSlotSelectable(slot: TimeSlot, nowMs: number): boolean {
  return isSlotAvailable(slot) && Date.parse(slot.startTime) >= nowMs;
}

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
  onContinue?: () => void;
  continueLabel?: string;
  todayDayKey: string;
  maxDayKey: string;
  sameDayAnchorDayKey?: string;
  sameDayCueMode?: AvailabilityWeekGridCueMode;
  cartedStartTimes?: Set<string>;
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
  onContinue?: () => void;
  continueLabel: string;
}

const WeekGridSummaryBar = React.memo(function WeekGridSummaryBar({
  allHours,
  slotLookup,
  dayKeys,
  hoursPerDay,
  timeZone,
  onRangeChange,
  onContinue,
  continueLabel,
}: WeekGridSummaryBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: "easeOut" as const };

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

    if (startDayIdx !== endDayIdx) return null;

    const dk = dayKeys[startDayIdx];
    const hourMap = slotLookup.get(dk);
    if (!hourMap) return null;

    const startSlot = hourMap.get(allHours[startHourIdx]);
    const endSlot = hourMap.get(allHours[endHourIdx]);
    if (!startSlot || !endSlot) return null;

    let total = 0;
    let allHavePrice = true;
    for (let i = startHourIdx; i <= endHourIdx; i++) {
      const slot = hourMap.get(allHours[i]);
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
    <AnimatePresence mode="wait">
      <motion.div
        key="summary"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={motionTransition}
        className="overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
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
                  " \u00B7 Click another slot to extend"}
                {summaryData.priceCents !== undefined &&
                  ` \u00B7 ${formatCurrency(summaryData.priceCents, summaryData.currency)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onRangeChange({ startTime: "", durationMinutes: 0 })
              }
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Clear
            </button>
            {onContinue &&
              !summaryData.isAwaitingEndClick &&
              summaryData.slotCount > 1 && (
                <button
                  type="button"
                  onClick={onContinue}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {continueLabel}
                </button>
              )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
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
}

const WeekGridCell = React.memo(function WeekGridCell({
  linearIdx,
  slot,
  dayKey,
  hourIdx,
  isDisabled,
  timeZone,
  isInCart,
}: WeekGridCellProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: "easeOut" as const };

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
        "group/cell relative flex w-full items-center justify-center border-t border-border/50 transition-all duration-150 touch-none",
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
      style={{ height: WEEK_ROW_HEIGHT }}
    >
      {/* Left accent bar for selected range */}
      {inRange && (
        <motion.div
          initial={shouldReduceMotion ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 bg-primary origin-top",
            isStart && "rounded-tl",
            isEnd && "rounded-bl",
          )}
          transition={motionTransition}
        />
      )}

      {isReserved && (
        <span className="text-xs font-medium text-destructive/50">Booked</span>
      )}
      {isMaintenance && (
        <span className="text-xs font-medium text-warning-foreground/60">
          Maint.
        </span>
      )}
      {inRange && (
        <div className="flex flex-col items-center gap-0.5">
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0.5 }}
            animate={{ scale: 1 }}
            className={cn(
              "h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/25",
              isPendingStart &&
                "h-2.5 w-2.5 ring-2 ring-primary/20 animate-pulse",
            )}
            transition={motionTransition}
          />
          {slot?.priceCents !== undefined && (
            <span className="text-xs font-medium tabular-nums text-primary/70">
              {formatCurrency(slot.priceCents, slot.currency ?? "PHP")}
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
            <span className="text-xs font-medium tabular-nums text-success/80">
              {formatCurrency(slot.priceCents, slot.currency ?? "PHP")}
            </span>
          )}
        </div>
      )}
      {available && !inRange && !isInCart && slot && (
        <div className="flex flex-col items-center gap-0.5">
          {slot.priceCents !== undefined ? (
            <span className="text-xs font-medium tabular-nums text-success/80 group-hover/cell:text-success">
              {formatCurrency(slot.priceCents, slot.currency ?? "PHP")}
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
  onContinue,
  continueLabel = "Continue to review",
  todayDayKey,
  maxDayKey,
  sameDayAnchorDayKey,
  sameDayCueMode = "none",
  cartedStartTimes,
}: AvailabilityWeekGridProps) {
  const nowMs = useNowMs({ intervalMs: 10_000 });

  const allHours = React.useMemo(() => {
    let minHour = 23;
    let maxHour = 0;
    for (const [, slots] of slotsByDay) {
      for (const slot of slots) {
        const h = getHourFromSlot(slot, timeZone);
        if (h < minHour) minHour = h;
        if (h > maxHour) maxHour = h;
      }
    }
    if (minHour > maxHour) return [] as number[];
    return Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);
  }, [slotsByDay, timeZone]);

  const slotLookup = React.useMemo(() => {
    const map = new Map<string, Map<number, TimeSlot>>();
    for (const [dk, slots] of slotsByDay) {
      const hourMap = new Map<number, TimeSlot>();
      for (const slot of slots) {
        hourMap.set(getHourFromSlot(slot, timeZone), slot);
      }
      map.set(dk, hourMap);
    }
    return map;
  }, [slotsByDay, timeZone]);

  const hoursPerDay = allHours.length;

  // Linear index mapping: linearIdx = dayColIndex * hoursPerDay + hourIdx
  const toLinear = React.useCallback(
    (dayColIdx: number, hourIdx: number) => dayColIdx * hoursPerDay + hourIdx,
    [hoursPerDay],
  );

  // Committed selection → linear indices
  const committedRange = React.useMemo(() => {
    if (!selectedRange) return null;
    if (Date.parse(selectedRange.startTime) < nowMs) return null;
    for (let di = 0; di < dayKeys.length; di++) {
      const dk = dayKeys[di];
      const hourMap = slotLookup.get(dk);
      if (!hourMap) continue;
      for (let hi = 0; hi < allHours.length; hi++) {
        const slot = hourMap.get(allHours[hi]);
        if (slot && isSameInstant(slot.startTime, selectedRange.startTime)) {
          const count = selectedRange.durationMinutes / TIMELINE_SLOT_DURATION;
          return {
            startIdx: toLinear(di, hi),
            endIdx: toLinear(di, hi + count - 1),
          };
        }
      }
    }
    return null;
  }, [selectedRange, dayKeys, slotLookup, allHours, toLinear, nowMs]);

  // Build config
  const config = React.useMemo<RangeSelectionConfig>(() => {
    const getDayHour = (idx: number) => ({
      dayColIdx: Math.floor(idx / hoursPerDay),
      hourIdx: idx % hoursPerDay,
    });

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
        // Must be same day
        if (a.dayColIdx !== t.dayColIdx) return null;
        const dk = dayKeys[a.dayColIdx];
        const hourMap = slotLookup.get(dk);
        if (!hourMap) return null;
        const lo = Math.min(a.hourIdx, t.hourIdx);
        const hi = Math.max(a.hourIdx, t.hourIdx);
        for (let i = lo; i <= hi; i++) {
          const slot = hourMap.get(allHours[i]);
          if (!slot || !isSlotSelectable(slot, nowMs)) return null;
        }
        return {
          startIdx: toLinear(a.dayColIdx, lo),
          endIdx: toLinear(a.dayColIdx, hi),
        };
      },
      clampToContiguous: (anchorIdx, targetIdx) => {
        const a = getDayHour(anchorIdx);
        const t = getDayHour(targetIdx);
        if (a.dayColIdx !== t.dayColIdx) return anchorIdx;
        const dk = dayKeys[a.dayColIdx];
        const hourMap = slotLookup.get(dk);
        if (!hourMap) return anchorIdx;
        const direction = t.hourIdx >= a.hourIdx ? 1 : -1;
        let lastValid = a.hourIdx;
        let i = a.hourIdx + direction;
        while (direction > 0 ? i <= t.hourIdx : i >= t.hourIdx) {
          const slot = hourMap.get(allHours[i]);
          if (!slot || !isSlotSelectable(slot, nowMs)) break;
          lastValid = i;
          i += direction;
        }
        return toLinear(a.dayColIdx, lastValid);
      },
      commitRange: (startIdx, endIdx) => {
        const s = getDayHour(startIdx);
        const dk = dayKeys[s.dayColIdx];
        const hourMap = slotLookup.get(dk);
        if (!hourMap) return;
        const slot = hourMap.get(allHours[s.hourIdx]);
        if (!slot) return;
        const slotCount = endIdx - startIdx + 1;
        onRangeChange({
          startTime: slot.startTime,
          durationMinutes: slotCount * TIMELINE_SLOT_DURATION,
        });
      },
    };
  }, [
    dayKeys,
    slotLookup,
    allHours,
    hoursPerDay,
    toLinear,
    onRangeChange,
    nowMs,
  ]);

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
        onContinue={onContinue}
        continueLabel={continueLabel}
        todayDayKey={todayDayKey}
        maxDayKey={maxDayKey}
        sameDayAnchorDayKey={sameDayAnchorDayKey}
        sameDayCueMode={sameDayCueMode}
        toLinear={toLinear}
        nowMs={nowMs}
        cartedStartTimes={cartedStartTimes}
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
  onContinue?: () => void;
  continueLabel: string;
  todayDayKey: string;
  maxDayKey: string;
  sameDayAnchorDayKey?: string;
  sameDayCueMode: AvailabilityWeekGridCueMode;
  toLinear: (dayColIdx: number, hourIdx: number) => number;
  nowMs: number;
  cartedStartTimes?: Set<string>;
}

function WeekGridInner({
  dayKeys,
  allHours,
  slotLookup,
  hoursPerDay,
  timeZone,
  onRangeChange,
  onDayClick,
  onContinue,
  continueLabel,
  todayDayKey,
  maxDayKey,
  sameDayAnchorDayKey,
  sameDayCueMode,
  toLinear,
  nowMs,
  cartedStartTimes,
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
      className="space-y-3 select-none"
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
        onContinue={onContinue}
        continueLabel={continueLabel}
      />

      {sameDayAnchorLabel ? (
        <div className="rounded-lg border border-success/35 bg-success-light/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Same-day booking:</span>{" "}
          add more courts on{" "}
          <span className="font-medium">{sameDayAnchorLabel}</span>.
        </div>
      ) : null}

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div
            className="grid gap-x-0"
            style={{
              gridTemplateColumns: "60px repeat(7, minmax(80px, 1fr))",
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
              return (
                <button
                  key={`hdr-${dk}`}
                  type="button"
                  onClick={() => onDayClick(dk)}
                  disabled={isPast || isBeyondMax}
                  className={cn(
                    "border-b border-border/70 px-1 py-2 text-center text-xs font-semibold transition-colors",
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
                    !isPast &&
                      !isBeyondMax &&
                      (isAnchorCue
                        ? "hover:bg-success-light/70 cursor-pointer"
                        : hasAnchorCue
                          ? "hover:bg-muted/30 cursor-pointer"
                          : "hover:bg-accent/10 cursor-pointer"),
                  )}
                >
                  <div>{formatInTimeZone(date, timeZone, "EEE")}</div>
                  <div
                    className={cn(
                      "mt-0.5 text-base font-heading font-bold",
                      isToday &&
                        "inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground",
                    )}
                  >
                    {formatInTimeZone(date, timeZone, "d")}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hour rows */}
          <div
            className="grid gap-x-0"
            style={{
              gridTemplateColumns: "60px repeat(7, minmax(80px, 1fr))",
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
                    className="flex items-start pr-2 pt-1 text-right text-xs text-muted-foreground font-mono"
                    style={{ height: WEEK_ROW_HEIGHT }}
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
                    "relative border-l border-border/70",
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
};

export function AvailabilityWeekGridSkeleton({
  dayKeys,
  timeZone,
}: AvailabilityWeekGridSkeletonProps) {
  const skeletonHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="min-w-[700px]">
        <div
          className="grid gap-x-0"
          style={{
            gridTemplateColumns: "60px repeat(7, minmax(80px, 1fr))",
          }}
        >
          <div />
          {dayKeys.map((dk) => {
            const date = parseDayKeyToDate(dk, timeZone);
            return (
              <div
                key={`skel-hdr-${dk}`}
                className="border-b border-border/70 px-1 py-2 text-center text-xs font-semibold"
              >
                <div>{formatInTimeZone(date, timeZone, "EEE")}</div>
                <div className="mt-0.5 text-base font-heading font-bold">
                  {formatInTimeZone(date, timeZone, "d")}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="grid gap-x-0"
          style={{
            gridTemplateColumns: "60px repeat(7, minmax(80px, 1fr))",
          }}
        >
          <div>
            {skeletonHours.map((h) => (
              <div
                key={`skel-t-${h}`}
                className="flex items-start pr-2 pt-1 text-right text-xs text-muted-foreground font-mono"
                style={{ height: WEEK_ROW_HEIGHT }}
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
                  style={{ height: WEEK_ROW_HEIGHT }}
                >
                  <div className="mx-2 mt-2 h-4 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
