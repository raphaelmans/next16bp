"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatInTimeZone,
  formatTimeInTimeZone,
} from "@/shared/lib/format";
import { getZonedDayRangeFromDayKey } from "@/shared/lib/time-zone";
import type { TimeSlot } from "./time-slot-picker";

const TIMELINE_SLOT_DURATION = 60;
const WEEK_ROW_HEIGHT = 56;

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

export type AvailabilityWeekGridRange = {
  startTime: string;
  durationMinutes: number;
};

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
};

type CellCoord = { dayKey: string; hourIdx: number };

function isSlotAvailable(slot: TimeSlot): boolean {
  return slot.status === "available";
}

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
}: AvailabilityWeekGridProps) {
  const shouldReduceMotion = useReducedMotion();

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

  // --- Selection state ---
  // Committed selection from props
  const committedCells = React.useMemo(() => {
    if (!selectedRange)
      return { dayKey: null as string | null, startIdx: -1, endIdx: -1 };
    for (const dk of dayKeys) {
      const hourMap = slotLookup.get(dk);
      if (!hourMap) continue;
      for (let hi = 0; hi < allHours.length; hi++) {
        const slot = hourMap.get(allHours[hi]);
        if (slot && slot.startTime === selectedRange.startTime) {
          const count = selectedRange.durationMinutes / TIMELINE_SLOT_DURATION;
          return { dayKey: dk, startIdx: hi, endIdx: hi + count - 1 };
        }
      }
    }
    return { dayKey: null, startIdx: -1, endIdx: -1 };
  }, [selectedRange, dayKeys, slotLookup, allHours]);

  // Drag state
  const [anchorCoord, setAnchorCoord] = React.useState<CellCoord | null>(null);
  const [hoverCoord, setHoverCoord] = React.useState<CellCoord | null>(null);
  const didDragRef = React.useRef(false);
  const suppressClickRef = React.useRef(false);
  const isDragging = anchorCoord !== null;

  // Hover for two-click preview
  const [hoveredCoord, setHoveredCoord] = React.useState<CellCoord | null>(
    null,
  );

  const isAwaitingEndClick =
    committedCells.dayKey !== null &&
    committedCells.startIdx === committedCells.endIdx &&
    !isDragging;

  // Compute contiguous range within a single day column
  const computeRange = React.useCallback(
    (
      dayKey: string,
      anchorIdx: number,
      targetIdx: number,
    ): { startIdx: number; endIdx: number } | null => {
      const hourMap = slotLookup.get(dayKey);
      if (!hourMap) return null;
      const lo = Math.min(anchorIdx, targetIdx);
      const hi = Math.max(anchorIdx, targetIdx);
      for (let i = lo; i <= hi; i++) {
        const slot = hourMap.get(allHours[i]);
        if (!slot || !isSlotAvailable(slot)) return null;
      }
      return { startIdx: lo, endIdx: hi };
    },
    [allHours, slotLookup],
  );

  const clampToContiguous = React.useCallback(
    (dayKey: string, anchorIdx: number, targetIdx: number): number => {
      const hourMap = slotLookup.get(dayKey);
      if (!hourMap) return anchorIdx;
      const direction = targetIdx >= anchorIdx ? 1 : -1;
      let lastValid = anchorIdx;
      let i = anchorIdx + direction;
      while (direction > 0 ? i <= targetIdx : i >= targetIdx) {
        const slot = hourMap.get(allHours[i]);
        if (!slot || !isSlotAvailable(slot)) break;
        lastValid = i;
        i += direction;
      }
      return lastValid;
    },
    [allHours, slotLookup],
  );

  // Preview range during drag
  const dragPreview = React.useMemo(() => {
    if (!anchorCoord || !hoverCoord) return null;
    if (anchorCoord.dayKey !== hoverCoord.dayKey) return null;
    const clamped = clampToContiguous(
      anchorCoord.dayKey,
      anchorCoord.hourIdx,
      hoverCoord.hourIdx,
    );
    return {
      dayKey: anchorCoord.dayKey,
      ...computeRange(anchorCoord.dayKey, anchorCoord.hourIdx, clamped),
    };
  }, [anchorCoord, hoverCoord, clampToContiguous, computeRange]);

  // Hover preview for two-click
  const hoverPreview = React.useMemo(() => {
    if (!isAwaitingEndClick || !hoveredCoord || !committedCells.dayKey)
      return null;
    if (hoveredCoord.dayKey !== committedCells.dayKey) return null;
    if (hoveredCoord.hourIdx === committedCells.startIdx) return null;
    return computeRange(
      committedCells.dayKey,
      committedCells.startIdx,
      hoveredCoord.hourIdx,
    );
  }, [isAwaitingEndClick, hoveredCoord, committedCells, computeRange]);

  const commitRange = React.useCallback(
    (dayKey: string, startIdx: number, endIdx: number) => {
      const hourMap = slotLookup.get(dayKey);
      if (!hourMap) return;
      const slot = hourMap.get(allHours[startIdx]);
      if (!slot) return;
      const slotCount = endIdx - startIdx + 1;
      onRangeChange({
        startTime: slot.startTime,
        durationMinutes: slotCount * TIMELINE_SLOT_DURATION,
      });
    },
    [allHours, onRangeChange, slotLookup],
  );

  const handlePointerDown = React.useCallback(
    (dayKey: string, hourIdx: number) => {
      const hourMap = slotLookup.get(dayKey);
      const slot = hourMap?.get(allHours[hourIdx]);
      if (!slot || !isSlotAvailable(slot)) return;
      didDragRef.current = false;
      setAnchorCoord({ dayKey, hourIdx });
      setHoverCoord({ dayKey, hourIdx });
    },
    [allHours, slotLookup],
  );

  const handlePointerEnter = React.useCallback(
    (dayKey: string, hourIdx: number) => {
      if (anchorCoord && anchorCoord.dayKey === dayKey) {
        if (hourIdx !== anchorCoord.hourIdx) {
          didDragRef.current = true;
        }
        setHoverCoord({ dayKey, hourIdx });
      }
      const hourMap = slotLookup.get(dayKey);
      const slot = hourMap?.get(allHours[hourIdx]);
      if (slot && isSlotAvailable(slot)) {
        setHoveredCoord({ dayKey, hourIdx });
      }
    },
    [anchorCoord, allHours, slotLookup],
  );

  const handlePointerUp = React.useCallback(() => {
    if (!anchorCoord || !hoverCoord) {
      setAnchorCoord(null);
      setHoverCoord(null);
      return;
    }
    // Only commit a drag range if the pointer actually moved to a different cell
    if (didDragRef.current && anchorCoord.dayKey === hoverCoord.dayKey) {
      const clamped = clampToContiguous(
        anchorCoord.dayKey,
        anchorCoord.hourIdx,
        hoverCoord.hourIdx,
      );
      const range = computeRange(
        anchorCoord.dayKey,
        anchorCoord.hourIdx,
        clamped,
      );
      if (range) {
        commitRange(anchorCoord.dayKey, range.startIdx, range.endIdx);
        suppressClickRef.current = true;
      }
    }
    didDragRef.current = false;
    setAnchorCoord(null);
    setHoverCoord(null);
  }, [anchorCoord, hoverCoord, clampToContiguous, commitRange, computeRange]);

  const handleClick = React.useCallback(
    (dayKey: string, hourIdx: number, shiftKey: boolean) => {
      const hourMap = slotLookup.get(dayKey);
      const slot = hourMap?.get(allHours[hourIdx]);
      if (!slot || !isSlotAvailable(slot)) return;

      // Shift+click to extend
      if (shiftKey && committedCells.dayKey === dayKey) {
        const range = computeRange(dayKey, committedCells.startIdx, hourIdx);
        if (range) {
          commitRange(dayKey, range.startIdx, range.endIdx);
        }
        return;
      }

      // Second click in two-click flow
      if (
        isAwaitingEndClick &&
        committedCells.dayKey === dayKey &&
        hourIdx !== committedCells.startIdx
      ) {
        const range = computeRange(dayKey, committedCells.startIdx, hourIdx);
        if (range) {
          commitRange(dayKey, range.startIdx, range.endIdx);
        } else {
          commitRange(dayKey, hourIdx, hourIdx);
        }
        return;
      }

      // New start
      commitRange(dayKey, hourIdx, hourIdx);
    },
    [
      allHours,
      commitRange,
      committedCells,
      computeRange,
      isAwaitingEndClick,
      slotLookup,
    ],
  );

  // Global pointer up
  React.useEffect(() => {
    if (!isDragging) return;
    const onUp = () => handlePointerUp();
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [isDragging, handlePointerUp]);

  // Determine active range for rendering
  const activeRange = React.useMemo(() => {
    if (
      dragPreview &&
      dragPreview.startIdx !== undefined &&
      dragPreview.endIdx !== undefined
    ) {
      return {
        dayKey: dragPreview.dayKey,
        startIdx: dragPreview.startIdx,
        endIdx: dragPreview.endIdx,
      };
    }
    if (committedCells.dayKey) {
      return {
        dayKey: committedCells.dayKey,
        startIdx: committedCells.startIdx,
        endIdx: committedCells.endIdx,
      };
    }
    return null;
  }, [dragPreview, committedCells]);

  // Price calculation
  const rangePriceCents = React.useMemo(() => {
    if (!activeRange || !activeRange.dayKey) return undefined;
    const hourMap = slotLookup.get(activeRange.dayKey);
    if (!hourMap) return undefined;
    let total = 0;
    let allHavePrice = true;
    for (let i = activeRange.startIdx; i <= activeRange.endIdx; i++) {
      const slot = hourMap.get(allHours[i]);
      if (slot?.priceCents !== undefined) {
        total += slot.priceCents as number;
      } else {
        allHavePrice = false;
      }
    }
    return allHavePrice ? total : undefined;
  }, [activeRange, allHours, slotLookup]);

  const rangeCurrency = React.useMemo(() => {
    if (!activeRange?.dayKey) return "PHP";
    const hourMap = slotLookup.get(activeRange.dayKey);
    const slot = hourMap?.get(allHours[activeRange.startIdx]);
    return slot?.currency ?? "PHP";
  }, [activeRange, allHours, slotLookup]);

  const rangeSlotCount = activeRange
    ? activeRange.endIdx - activeRange.startIdx + 1
    : 0;
  const rangeDurationHours = rangeSlotCount * (TIMELINE_SLOT_DURATION / 60);

  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: "easeOut" as const };

  // Summary bar data
  const summaryStartSlot = React.useMemo(() => {
    if (!activeRange?.dayKey) return null;
    const hourMap = slotLookup.get(activeRange.dayKey);
    return hourMap?.get(allHours[activeRange.startIdx]) ?? null;
  }, [activeRange, allHours, slotLookup]);

  const summaryEndSlot = React.useMemo(() => {
    if (!activeRange?.dayKey) return null;
    const hourMap = slotLookup.get(activeRange.dayKey);
    return hourMap?.get(allHours[activeRange.endIdx]) ?? null;
  }, [activeRange, allHours, slotLookup]);

  const refDayKey = dayKeys[0];
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

  // Helper to check if cell is in active range
  const isCellInRange = (dayKey: string, hourIdx: number) =>
    activeRange !== null &&
    dayKey === activeRange.dayKey &&
    hourIdx >= activeRange.startIdx &&
    hourIdx <= activeRange.endIdx;

  const isCellRangeStart = (dayKey: string, hourIdx: number) =>
    activeRange !== null &&
    dayKey === activeRange.dayKey &&
    hourIdx === activeRange.startIdx;

  const isCellRangeEnd = (dayKey: string, hourIdx: number) =>
    activeRange !== null &&
    dayKey === activeRange.dayKey &&
    hourIdx === activeRange.endIdx;

  const isCellInHoverPreview = (dayKey: string, hourIdx: number) =>
    hoverPreview !== null &&
    dayKey === committedCells.dayKey &&
    hourIdx >= hoverPreview.startIdx &&
    hourIdx <= hoverPreview.endIdx &&
    !isCellInRange(dayKey, hourIdx);

  const isCellPendingStart = (dayKey: string, hourIdx: number) =>
    isAwaitingEndClick &&
    dayKey === committedCells.dayKey &&
    hourIdx === committedCells.startIdx;

  return (
    <div
      className="space-y-3 select-none"
      onPointerLeave={() => {
        if (isDragging) handlePointerUp();
        setHoveredCoord(null);
      }}
    >
      {/* Summary bar */}
      <AnimatePresence mode="wait">
        {activeRange && summaryStartSlot && summaryEndSlot && (
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
                    {formatTimeInTimeZone(summaryStartSlot.startTime, timeZone)}
                    {" \u2013 "}
                    {formatTimeInTimeZone(summaryEndSlot.endTime, timeZone)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rangeDurationHours}h
                    {isAwaitingEndClick &&
                      " \u00B7 Click another slot to extend"}
                    {rangePriceCents !== undefined &&
                      ` \u00B7 ${formatCurrency(rangePriceCents, rangeCurrency)}`}
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
                {onContinue && !isAwaitingEndClick && rangeSlotCount > 1 && (
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
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
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
              const isToday = dk === todayDayKey;
              const isPast = dk < todayDayKey;
              const isBeyondMax = dk > maxDayKey;

              return (
                <button
                  key={`hdr-${dk}`}
                  type="button"
                  onClick={() => onDayClick(dk)}
                  disabled={isPast || isBeyondMax}
                  className={cn(
                    "border-b border-border/70 px-1 py-2 text-center text-xs font-semibold transition-colors",
                    isToday && "text-primary",
                    isPast && "text-muted-foreground/40",
                    isBeyondMax && "text-muted-foreground/40",
                    !isPast &&
                      !isBeyondMax &&
                      "hover:bg-accent/10 cursor-pointer",
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

            {dayKeys.map((dk) => {
              const isPast = dk < todayDayKey;
              const isBeyondMax = dk > maxDayKey;
              const isDisabled = isPast || isBeyondMax;
              const isToday = dk === todayDayKey;
              const hourMap = slotLookup.get(dk);

              return (
                <div
                  key={`col-${dk}`}
                  className={cn(
                    "relative border-l border-border/70",
                    isDisabled && "opacity-40",
                    isToday && "bg-primary/[0.02]",
                  )}
                >
                  {allHours.map((hour, hourIdx) => {
                    const slot = hourMap?.get(hour);
                    const available = slot ? isSlotAvailable(slot) : false;
                    const isBooked =
                      slot?.status === "booked" || slot?.status === "held";
                    const isMaintenance =
                      slot?.unavailableReason === "MAINTENANCE";
                    const isReserved = isBooked && !isMaintenance;
                    const inRange = isCellInRange(dk, hourIdx);
                    const isStart = isCellRangeStart(dk, hourIdx);
                    const isEnd = isCellRangeEnd(dk, hourIdx);
                    const inHover = isCellInHoverPreview(dk, hourIdx);
                    const isPendingStart = isCellPendingStart(dk, hourIdx);

                    return (
                      <button
                        key={`${dk}-${hour}`}
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
                          if (slot && available && !isDisabled)
                            handlePointerDown(dk, hourIdx);
                        }}
                        onPointerEnter={() => {
                          if (!isDisabled) handlePointerEnter(dk, hourIdx);
                        }}
                        onPointerLeave={() => setHoveredCoord(null)}
                        onClick={(e) => {
                          if (suppressClickRef.current) {
                            suppressClickRef.current = false;
                            return;
                          }
                          if (slot && available && !isDisabled)
                            handleClick(dk, hourIdx, e.shiftKey);
                        }}
                        onKeyDown={(e) => {
                          if (
                            (e.key === "Enter" || e.key === " ") &&
                            slot &&
                            available &&
                            !isDisabled
                          ) {
                            e.preventDefault();
                            handleClick(dk, hourIdx, e.shiftKey);
                          }
                        }}
                        className={cn(
                          "group/cell relative flex w-full items-center justify-center border-t border-border/50 transition-all duration-150 touch-none",
                          available &&
                            !inRange &&
                            !inHover &&
                            "cursor-pointer bg-success-light/20 hover:bg-success-light/50",
                          inHover && "bg-primary/5 cursor-pointer",
                          inRange && !isPendingStart && "bg-primary/8",
                          isPendingStart &&
                            "bg-primary/15 ring-1 ring-inset ring-primary/25",
                          isReserved && "bg-destructive-light/40",
                          isMaintenance && "bg-warning-light/50",
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
                          <span className="text-xs font-medium text-destructive/50">
                            Booked
                          </span>
                        )}
                        {isMaintenance && (
                          <span className="text-xs font-medium text-warning-foreground/60">
                            Maint.
                          </span>
                        )}
                        {inRange && (
                          <div className="flex flex-col items-center gap-0.5">
                            <motion.div
                              initial={
                                shouldReduceMotion ? false : { scale: 0.5 }
                              }
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
                                {formatCurrency(
                                  slot.priceCents,
                                  slot.currency ?? "PHP",
                                )}
                              </span>
                            )}
                          </div>
                        )}
                        {available && !inRange && slot && (
                          <div className="flex flex-col items-center gap-0.5">
                            {slot.priceCents !== undefined ? (
                              <span className="text-xs font-medium tabular-nums text-success/80 group-hover/cell:text-success">
                                {formatCurrency(
                                  slot.priceCents,
                                  slot.currency ?? "PHP",
                                )}
                              </span>
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full bg-success/50 transition-transform group-hover/cell:scale-150 group-hover/cell:bg-success" />
                            )}
                          </div>
                        )}
                      </button>
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
