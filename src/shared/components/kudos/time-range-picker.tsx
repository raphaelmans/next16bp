"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTimeInTimeZone } from "@/shared/lib/format";
import type { TimeSlot } from "./time-slot-picker";

const MAX_DURATION_MINUTES = 1440;
const SLOT_STEP_MINUTES = 60;

export interface TimeRangePickerProps {
  slots: TimeSlot[];
  timeZone: string;
  selectedStartTime?: string;
  selectedDurationMinutes?: number;
  showPrice?: boolean;
  onChange?: (range: { startTime: string; durationMinutes: number }) => void;
  onClear?: () => void;
  className?: string;
}

type SlotIndex = number;

function getSlotIndex(slots: TimeSlot[], startTime: string): SlotIndex {
  return slots.findIndex((s) => s.startTime === startTime);
}

function isSlotAvailable(slot: TimeSlot): boolean {
  return slot.status === "available";
}

function computeContiguousRange(
  slots: TimeSlot[],
  anchorIdx: number,
  currentIdx: number,
): { startIdx: number; endIdx: number } | null {
  const startIdx = Math.min(anchorIdx, currentIdx);
  const endIdx = Math.max(anchorIdx, currentIdx);

  // Check all slots in range are available
  for (let i = startIdx; i <= endIdx; i++) {
    if (!isSlotAvailable(slots[i])) {
      return null;
    }
  }

  // Check duration constraint
  const slotCount = endIdx - startIdx + 1;
  const durationMinutes = slotCount * SLOT_STEP_MINUTES;
  if (durationMinutes > MAX_DURATION_MINUTES) {
    return null;
  }

  return { startIdx, endIdx };
}

function clampToContiguous(
  slots: TimeSlot[],
  anchorIdx: number,
  targetIdx: number,
): number {
  const direction = targetIdx >= anchorIdx ? 1 : -1;
  let lastValid = anchorIdx;

  let i = anchorIdx + direction;
  while (direction > 0 ? i <= targetIdx : i >= targetIdx) {
    if (!isSlotAvailable(slots[i])) break;
    const slotCount = Math.abs(i - anchorIdx) + 1;
    if (slotCount * SLOT_STEP_MINUTES > MAX_DURATION_MINUTES) break;
    lastValid = i;
    i += direction;
  }

  return lastValid;
}

export function TimeRangePicker({
  slots,
  timeZone,
  selectedStartTime,
  selectedDurationMinutes,
  showPrice = true,
  onChange,
  onClear,
  className,
}: TimeRangePickerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [anchorIdx, setAnchorIdx] = React.useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const isDragging = anchorIdx !== null;

  // Compute committed selection from props
  const committedRange = React.useMemo(() => {
    if (!selectedStartTime || !selectedDurationMinutes) return null;
    const startIdx = getSlotIndex(slots, selectedStartTime);
    if (startIdx === -1) return null;
    const slotCount = selectedDurationMinutes / SLOT_STEP_MINUTES;
    const endIdx = startIdx + slotCount - 1;
    if (endIdx >= slots.length) return null;
    return { startIdx, endIdx };
  }, [selectedStartTime, selectedDurationMinutes, slots]);

  // Compute preview range during drag
  const previewRange = React.useMemo(() => {
    if (anchorIdx === null || hoverIdx === null) return null;
    const clampedTarget = clampToContiguous(slots, anchorIdx, hoverIdx);
    return computeContiguousRange(slots, anchorIdx, clampedTarget);
  }, [anchorIdx, hoverIdx, slots]);

  // Active range = preview during drag, committed otherwise
  const activeRange = previewRange ?? committedRange;

  // Is "waiting for second click" state?
  const isAwaitingEndClick =
    committedRange !== null &&
    committedRange.startIdx === committedRange.endIdx &&
    !isDragging;

  // Preview range for hover in awaiting-end state
  const hoverPreviewRange = React.useMemo(() => {
    if (!isAwaitingEndClick || hoveredIdx === null || !committedRange)
      return null;
    if (hoveredIdx === committedRange.startIdx) return null;
    return computeContiguousRange(slots, committedRange.startIdx, hoveredIdx);
  }, [isAwaitingEndClick, hoveredIdx, committedRange, slots]);

  const commitRange = React.useCallback(
    (startIdx: number, endIdx: number) => {
      const startSlot = slots[startIdx];
      const slotCount = endIdx - startIdx + 1;
      const durationMinutes = slotCount * SLOT_STEP_MINUTES;
      onChange?.({ startTime: startSlot.startTime, durationMinutes });
    },
    [onChange, slots],
  );

  const handlePointerDown = React.useCallback(
    (idx: number) => {
      if (!isSlotAvailable(slots[idx])) return;
      setAnchorIdx(idx);
      setHoverIdx(idx);
    },
    [slots],
  );

  const handlePointerEnter = React.useCallback(
    (idx: number) => {
      if (anchorIdx === null) return;
      setHoverIdx(idx);
    },
    [anchorIdx],
  );

  const handlePointerUp = React.useCallback(() => {
    if (anchorIdx === null || hoverIdx === null) {
      setAnchorIdx(null);
      setHoverIdx(null);
      return;
    }

    // Only commit on actual drag (different slots); single clicks are handled by handleClick
    if (anchorIdx !== hoverIdx) {
      const clampedTarget = clampToContiguous(slots, anchorIdx, hoverIdx);
      const range = computeContiguousRange(slots, anchorIdx, clampedTarget);
      if (range) {
        commitRange(range.startIdx, range.endIdx);
      }
    }

    setAnchorIdx(null);
    setHoverIdx(null);
  }, [anchorIdx, commitRange, hoverIdx, slots]);

  // Click: two-click flow (tap start, tap end) + shift-click to extend
  const handleClick = React.useCallback(
    (idx: number, shiftKey: boolean) => {
      if (!isSlotAvailable(slots[idx])) return;

      if (shiftKey && committedRange) {
        // Shift+click: extend from committed start
        const range = computeContiguousRange(
          slots,
          committedRange.startIdx,
          idx,
        );
        if (range) {
          commitRange(range.startIdx, range.endIdx);
        }
        return;
      }

      if (
        committedRange &&
        committedRange.startIdx === committedRange.endIdx &&
        idx !== committedRange.startIdx
      ) {
        // Second click: extend from single-slot start to clicked slot
        const range = computeContiguousRange(
          slots,
          committedRange.startIdx,
          idx,
        );
        if (range) {
          commitRange(range.startIdx, range.endIdx);
        } else {
          // Blocked slots in between — reset to new start
          commitRange(idx, idx);
        }
        return;
      }

      // No range or already a multi-slot range — set new start
      commitRange(idx, idx);
    },
    [commitRange, committedRange, slots],
  );

  // Keyboard support
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent, idx: number) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick(idx, event.shiftKey);
      }
    },
    [handleClick],
  );

  // Global pointer up listener
  React.useEffect(() => {
    if (!isDragging) return;
    const onUp = () => handlePointerUp();
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [isDragging, handlePointerUp]);

  // Compute total price for range
  const rangePriceCents = React.useMemo(() => {
    if (!activeRange) return undefined;
    let total = 0;
    let allHavePrice = true;
    for (let i = activeRange.startIdx; i <= activeRange.endIdx; i++) {
      if (slots[i].priceCents !== undefined) {
        total += slots[i].priceCents as number;
      } else {
        allHavePrice = false;
      }
    }
    return allHavePrice ? total : undefined;
  }, [activeRange, slots]);

  const rangeCurrency = activeRange
    ? (slots[activeRange.startIdx].currency ?? "PHP")
    : "PHP";

  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: "easeOut" as const };

  const durationHours = activeRange
    ? (activeRange.endIdx - activeRange.startIdx + 1) * (SLOT_STEP_MINUTES / 60)
    : 0;

  return (
    <div
      className={cn("space-y-3 select-none", className)}
      onPointerLeave={() => {
        if (isDragging) handlePointerUp();
        setHoveredIdx(null);
      }}
    >
      {/* Summary bar */}
      <AnimatePresence mode="wait">
        {activeRange && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={motionTransition}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {formatTimeInTimeZone(
                      slots[activeRange.startIdx].startTime,
                      timeZone,
                    )}
                    {" \u2013 "}
                    {formatTimeInTimeZone(
                      slots[activeRange.endIdx].endTime,
                      timeZone,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {durationHours}h
                    {isAwaitingEndClick &&
                      " \u00B7 Click another slot to extend"}
                    {showPrice &&
                      rangePriceCents !== undefined &&
                      ` \u00B7 ${formatCurrency(rangePriceCents, rangeCurrency)}`}
                  </p>
                </div>
              </div>
              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline grid */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        {slots.map((slot, idx) => {
          const available = isSlotAvailable(slot);
          const isBooked = slot.status === "booked" || slot.status === "held";
          const isMaintenance = slot.unavailableReason === "MAINTENANCE";
          const isReserved = isBooked && !isMaintenance;
          const inRange =
            activeRange !== null &&
            idx >= activeRange.startIdx &&
            idx <= activeRange.endIdx;
          const isRangeStart =
            activeRange !== null && idx === activeRange.startIdx;
          const isRangeEnd = activeRange !== null && idx === activeRange.endIdx;

          // Hover preview highlighting
          const inHoverPreview =
            hoverPreviewRange !== null &&
            idx >= hoverPreviewRange.startIdx &&
            idx <= hoverPreviewRange.endIdx &&
            !inRange;

          const startLabel = formatTimeInTimeZone(slot.startTime, timeZone);
          const endLabel = formatTimeInTimeZone(slot.endTime, timeZone);

          return (
            <button
              type="button"
              key={slot.id}
              tabIndex={available ? 0 : -1}
              disabled={!available}
              aria-pressed={inRange}
              aria-label={`${startLabel} to ${endLabel}${!available ? " (unavailable)" : ""}`}
              className={cn(
                "group flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150",
                "touch-none appearance-none",
                "border-b border-border/50 last:border-b-0",
                // Available idle — soft green tint signals reservable
                available &&
                  !inRange &&
                  !inHoverPreview &&
                  "bg-success-light/20 hover:bg-success-light/50 cursor-pointer",
                // Hover preview (awaiting end click)
                inHoverPreview && "bg-primary/5 cursor-pointer",
                // In range — left accent strip via pseudo
                inRange && "bg-primary/8 relative",
                // Reserved by someone
                isReserved && "bg-destructive-light/40 cursor-not-allowed",
                // Maintenance
                isMaintenance && "bg-warning-light/50 cursor-not-allowed",
              )}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePointerDown(idx);
              }}
              onPointerEnter={() => {
                handlePointerEnter(idx);
                if (available) setHoveredIdx(idx);
              }}
              onPointerLeave={() => setHoveredIdx(null)}
              onClick={(e) => {
                if (!isDragging) handleClick(idx, e.shiftKey);
              }}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            >
              {/* Left accent bar for selected range */}
              {inRange && (
                <motion.div
                  layoutId={shouldReduceMotion ? undefined : "range-bar"}
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 bg-primary",
                    isRangeStart && "rounded-tl-xl",
                    isRangeEnd && "rounded-bl-xl",
                  )}
                  transition={motionTransition}
                />
              )}

              {/* Status dot */}
              <div className="shrink-0">
                {isMaintenance ? (
                  <div className="h-2 w-2 rounded-full bg-warning" />
                ) : isReserved ? (
                  <div className="h-2 w-2 rounded-full bg-destructive/50" />
                ) : inRange ? (
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="h-2.5 w-2.5 rounded-full bg-primary shadow-sm shadow-primary/25"
                    transition={motionTransition}
                  />
                ) : (
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full transition-colors duration-150",
                      "bg-success/60 group-hover:bg-success",
                    )}
                  />
                )}
              </div>

              {/* Time label */}
              <span
                className={cn(
                  "w-[7.5rem] shrink-0 font-mono text-xs tabular-nums tracking-tight",
                  inRange ? "text-primary font-semibold" : "text-foreground/80",
                  isReserved && "text-destructive/50 line-through",
                  isMaintenance && "text-warning-foreground/60",
                )}
              >
                {startLabel} &ndash; {endLabel}
              </span>

              {/* Status / price */}
              <span className="flex flex-1 items-center gap-2">
                {isMaintenance && (
                  <span className="inline-flex items-center rounded-md bg-warning-light px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
                    Maintenance
                  </span>
                )}
                {isReserved && (
                  <span className="inline-flex items-center rounded-md bg-destructive-light px-2 py-0.5 text-[11px] font-medium text-destructive">
                    {slot.status === "held" ? "On hold" : "Reserved"}
                  </span>
                )}
                {available && showPrice && slot.priceCents !== undefined && (
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      inRange ? "text-primary/80" : "text-muted-foreground",
                    )}
                  >
                    {formatCurrency(slot.priceCents, slot.currency ?? "PHP")}
                  </span>
                )}
              </span>

              {/* Range position indicator */}
              {(isRangeStart || isRangeEnd) && (
                <span className="shrink-0 text-[10px] font-heading font-semibold uppercase tracking-wider text-primary/60">
                  {isRangeStart && isRangeEnd
                    ? ""
                    : isRangeStart
                      ? "Start"
                      : "End"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {slots.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-10">
          <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
          <p className="font-body text-sm text-muted-foreground">
            No time slots available.
          </p>
        </div>
      )}
    </div>
  );
}

const SKELETON_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"];

export function TimeRangePickerSkeleton({ count = 8 }: { count?: number }) {
  const keys = SKELETON_KEYS.slice(0, count);
  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      {keys.map((key) => (
        <div
          key={key}
          className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
        >
          <div className="h-2 w-2 shrink-0 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-[7.5rem] rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-14 rounded-md bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
