"use client";

import { Check, Info } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { useShallow } from "zustand/shallow";
import {
  formatCurrency,
  formatInTimeZone,
  formatTimeInTimeZone,
} from "@/common/format";
import { useNowMs } from "@/common/hooks/use-now";
import { getZonedDayKey } from "@/common/time-zone";
import { useTouchIntent } from "@/common/use-touch-intent";
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

const MAX_DURATION_MINUTES = 1440;
const SLOT_STEP_MINUTES = 60;

const isSameInstant = (a: string, b: string): boolean => {
  const aMs = Date.parse(a);
  const bMs = Date.parse(b);
  if (Number.isFinite(aMs) && Number.isFinite(bMs)) {
    return aMs === bMs;
  }
  return a === b;
};

export interface TimeRangePickerProps {
  slots: TimeSlot[];
  timeZone: string;
  selectedStartTime?: string;
  selectedDurationMinutes?: number;
  selectedDayKey?: string;
  showDaySeparators?: boolean;
  showPrice?: boolean;
  onChange?: (range: { startTime: string; durationMinutes: number }) => void;
  onClear?: () => void;
  className?: string;
  cartedStartTimes?: Set<string>;
  /** When set, the selection started on a previous day (cross-midnight). */
  crossDayStartTime?: string;
}

export function isSlotAvailable(slot: TimeSlot): boolean {
  return slot.status === "available";
}

export function isSlotSelectable(slot: TimeSlot, nowMs: number): boolean {
  return isSlotAvailable(slot) && Date.parse(slot.startTime) >= nowMs;
}

function computeContiguousRange(
  slots: TimeSlot[],
  anchorIdx: number,
  currentIdx: number,
  nowMs: number,
): { startIdx: number; endIdx: number } | null {
  const startIdx = Math.min(anchorIdx, currentIdx);
  const endIdx = Math.max(anchorIdx, currentIdx);
  for (let i = startIdx; i <= endIdx; i++) {
    if (!isSlotSelectable(slots[i], nowMs)) return null;
  }
  const slotCount = endIdx - startIdx + 1;
  if (slotCount * SLOT_STEP_MINUTES > MAX_DURATION_MINUTES) return null;
  return { startIdx, endIdx };
}

function clampToContiguous(
  slots: TimeSlot[],
  anchorIdx: number,
  targetIdx: number,
  nowMs: number,
): number {
  const direction = targetIdx >= anchorIdx ? 1 : -1;
  let lastValid = anchorIdx;
  let i = anchorIdx + direction;
  while (direction > 0 ? i <= targetIdx : i >= targetIdx) {
    if (!isSlotSelectable(slots[i], nowMs)) break;
    const slotCount = Math.abs(i - anchorIdx) + 1;
    if (slotCount * SLOT_STEP_MINUTES > MAX_DURATION_MINUTES) break;
    lastValid = i;
    i += direction;
  }
  return lastValid;
}

// ---------------------------------------------------------------------------
// Summary Bar
// ---------------------------------------------------------------------------

interface SummaryBarProps {
  slots: TimeSlot[];
  timeZone: string;
  showPrice: boolean;
  onClear?: () => void;
}

const SummaryBar = React.memo(function SummaryBar({
  slots,
  timeZone,
  showPrice,
  onClear,
}: SummaryBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: "easeOut" as const };

  const activeStartIdx = useRangeSelection(selectActiveStartIdx);
  const activeEndIdx = useRangeSelection(selectActiveEndIdx);
  const isAwaitingEndClick = useRangeSelection((s) =>
    deriveIsAwaitingEndClick(s),
  );

  if (activeStartIdx === null || activeEndIdx === null) return null;

  // Compute price outside the selector to avoid closing over `slots`
  let rangePriceCents: number | undefined;
  let rangeCurrency = "PHP";
  {
    let total = 0;
    let allHavePrice = true;
    for (let i = activeStartIdx; i <= activeEndIdx; i++) {
      if (slots[i].priceCents !== undefined) {
        total += slots[i].priceCents as number;
      } else {
        allHavePrice = false;
      }
    }
    rangePriceCents = allHavePrice ? total : undefined;
    rangeCurrency = slots[activeStartIdx].currency ?? "PHP";
  }

  const durationHours =
    (activeEndIdx - activeStartIdx + 1) * (SLOT_STEP_MINUTES / 60);

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
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">
                {formatTimeInTimeZone(
                  slots[activeStartIdx].startTime,
                  timeZone,
                )}
                {" \u2013 "}
                {formatTimeInTimeZone(slots[activeEndIdx].endTime, timeZone)}
              </p>
              <p className="text-xs text-muted-foreground">
                {durationHours}h
                {isAwaitingEndClick && " \u00B7 Click another slot to extend"}
                {showPrice &&
                  rangePriceCents !== undefined &&
                  ` \u00B7 ${formatCurrency(rangePriceCents, rangeCurrency)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

// ---------------------------------------------------------------------------
// Slot Row
// ---------------------------------------------------------------------------

interface TimeSlotRowProps {
  idx: number;
  slot: TimeSlot;
  timeZone: string;
  dayContextLabel?: string;
  showPrice: boolean;
  isPast?: boolean;
  isInCart: boolean;
}

const TimeSlotRow = React.memo(function TimeSlotRow({
  idx,
  slot,
  timeZone,
  dayContextLabel,
  showPrice,
  isPast,
  isInCart,
}: TimeSlotRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: "easeOut" as const };

  const { inRange, isStart, isEnd, inHoverPreview } = useCellState(idx);

  const { pointerDown, pointerEnter, click, setHoveredIdx } = useRangeSelection(
    useShallow((s) => ({
      pointerDown: s.pointerDown,
      pointerEnter: s.pointerEnter,
      click: s.click,
      setHoveredIdx: s.setHoveredIdx,
    })),
  );

  const touchIntent = useTouchIntent({
    onConfirm: React.useCallback(
      (e: React.PointerEvent) => {
        e.preventDefault();
        pointerDown(idx, {
          clientX: e.clientX,
          clientY: e.clientY,
          pointerType: e.pointerType,
        });
      },
      [pointerDown, idx],
    ),
  });

  const available = isSlotAvailable(slot) && !isPast;
  const isPassed = Boolean(isPast && isSlotAvailable(slot));
  const isBooked = slot.status === "booked" || slot.status === "held";
  const isMaintenance = slot.unavailableReason === "MAINTENANCE";
  const isReserved = isBooked && !isMaintenance;

  const startLabel = formatTimeInTimeZone(slot.startTime, timeZone);
  const endLabel = formatTimeInTimeZone(slot.endTime, timeZone);

  return (
    <button
      type="button"
      tabIndex={available ? 0 : -1}
      disabled={!available}
      aria-pressed={inRange}
      aria-label={`${dayContextLabel ? `${dayContextLabel}, ` : ""}${startLabel} to ${endLabel}${
        isPassed ? " (passed)" : !available ? " (unavailable)" : ""
      }`}
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150",
        "appearance-none",
        "border-b border-border/50 last:border-b-0",
        available &&
          !inRange &&
          !inHoverPreview &&
          !isInCart &&
          "bg-success-light/20 hover:bg-success-light/50 cursor-pointer",
        isInCart &&
          !inRange &&
          "bg-success/10 ring-1 ring-inset ring-success/40 cursor-pointer",
        inHoverPreview && "bg-primary/5 cursor-pointer",
        inRange && "bg-primary/8 relative",
        isPassed && "bg-muted/40 cursor-not-allowed",
        isReserved && "bg-destructive-light/40 cursor-not-allowed",
        isMaintenance && "bg-warning-light/50 cursor-not-allowed",
      )}
      onPointerDown={touchIntent.onPointerDown}
      onPointerMove={touchIntent.onPointerMove}
      onPointerEnter={(e) => {
        pointerEnter(idx, {
          clientX: e.clientX,
          clientY: e.clientY,
          pointerType: e.pointerType,
        });
        if (available) setHoveredIdx(idx);
      }}
      onPointerLeave={() => {
        touchIntent.cancel();
        setHoveredIdx(null);
      }}
      onClick={(e) => click(idx, e.shiftKey)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          click(idx, e.shiftKey);
        }
      }}
    >
      {/* Left accent bar for selected range */}
      {inRange && (
        <motion.div
          layoutId={shouldReduceMotion ? undefined : "range-bar"}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 bg-primary",
            isStart && "rounded-tl-xl",
            isEnd && "rounded-bl-xl",
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
        ) : isPassed ? (
          <div className="h-2 w-2 rounded-full bg-muted-foreground/45" />
        ) : isInCart ? (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-success/20">
            <Check className="h-2.5 w-2.5 text-success" />
          </div>
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
          isPassed && "text-muted-foreground line-through",
          isReserved && "text-destructive/50 line-through",
          isMaintenance && "text-warning-foreground/60",
        )}
      >
        {startLabel} &ndash; {endLabel}
      </span>

      {/* Status / price */}
      <span className="flex flex-1 items-center gap-2">
        {dayContextLabel && (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {dayContextLabel}
          </span>
        )}
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
        {isPassed && (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Passed
          </span>
        )}
        {isInCart && (
          <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
            In booking
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
      {(isStart || isEnd) && (
        <span className="shrink-0 text-[10px] font-heading font-semibold uppercase tracking-wider text-primary/60">
          {isStart && isEnd ? "" : isStart ? "Start" : "End"}
        </span>
      )}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function TimeRangePicker({
  slots,
  timeZone,
  selectedStartTime,
  selectedDurationMinutes,
  selectedDayKey,
  showDaySeparators = true,
  showPrice = true,
  onChange,
  onClear,
  className,
  cartedStartTimes,
  crossDayStartTime,
}: TimeRangePickerProps) {
  const nowMs = useNowMs({ intervalMs: 10_000 });

  // Compute committed range from props
  const committedRange = React.useMemo(() => {
    if (!selectedStartTime || !selectedDurationMinutes) return null;
    const selectedStartMs = Date.parse(selectedStartTime);
    if (selectedStartMs < nowMs) return null;

    const startIdx = slots.findIndex((s) =>
      isSameInstant(s.startTime, selectedStartTime),
    );

    if (startIdx === -1 && slots.length > 0) {
      // Cross-day: selection start is before the visible slots
      const firstSlotMs = Date.parse(slots[0].startTime);
      if (selectedStartMs < firstSlotMs) {
        const preSlotMinutes = Math.round(
          (firstSlotMs - selectedStartMs) / 60_000,
        );
        const remainingMinutes = selectedDurationMinutes - preSlotMinutes;
        // No visible overlap on this day.
        if (remainingMinutes <= 0) return null;
        const visibleSlotCount = Math.ceil(
          remainingMinutes / SLOT_STEP_MINUTES,
        );
        const endIdx = visibleSlotCount - 1;
        if (endIdx >= slots.length) return null;
        return { startIdx: 0, endIdx };
      }
      return null;
    }

    if (startIdx === -1) return null;
    const slotCount = selectedDurationMinutes / SLOT_STEP_MINUTES;
    const endIdx = startIdx + slotCount - 1;
    // Selection can spill past this day's visible slots; keep visible portion
    // highlighted instead of clearing the day view.
    if (endIdx >= slots.length) {
      if (startIdx >= slots.length) return null;
      return { startIdx, endIdx: slots.length - 1 };
    }
    return { startIdx, endIdx };
  }, [nowMs, selectedStartTime, selectedDurationMinutes, slots]);

  // Build config — stable reference via useMemo
  const config = React.useMemo<RangeSelectionConfig>(
    () => ({
      isCellAvailable: (idx) => {
        const slot = slots[idx];
        return slot ? isSlotSelectable(slot, nowMs) : false;
      },
      computeRange: (anchorIdx, targetIdx) =>
        computeContiguousRange(slots, anchorIdx, targetIdx, nowMs),
      clampToContiguous: (anchorIdx, targetIdx) =>
        clampToContiguous(slots, anchorIdx, targetIdx, nowMs),
      commitRange: (startIdx, endIdx) => {
        const startSlot = slots[startIdx];
        if (!startSlot) return;

        if (crossDayStartTime) {
          // Cross-day: compute total duration from the cross-day anchor
          const endSlot = slots[endIdx];
          if (!endSlot) return;
          const endMs =
            Date.parse(endSlot.startTime) + SLOT_STEP_MINUTES * 60_000;
          const totalMinutes = Math.round(
            (endMs - Date.parse(crossDayStartTime)) / 60_000,
          );
          onChange?.({
            startTime: crossDayStartTime,
            durationMinutes: totalMinutes,
          });
        } else {
          const slotCount = endIdx - startIdx + 1;
          onChange?.({
            startTime: startSlot.startTime,
            durationMinutes: slotCount * SLOT_STEP_MINUTES,
          });
        }
      },
    }),
    [slots, nowMs, onChange, crossDayStartTime],
  );

  return (
    <RangeSelectionProvider config={config} committedRange={committedRange}>
      <TimeRangePickerInner
        slots={slots}
        timeZone={timeZone}
        showPrice={showPrice}
        onClear={onClear}
        className={className}
        nowMs={nowMs}
        cartedStartTimes={cartedStartTimes}
        selectedDayKey={selectedDayKey}
        showDaySeparators={showDaySeparators}
      />
    </RangeSelectionProvider>
  );
}

// Inner component inside the provider
function TimeRangePickerInner({
  slots,
  timeZone,
  showPrice,
  onClear,
  className,
  nowMs,
  cartedStartTimes,
  selectedDayKey,
  showDaySeparators,
}: {
  slots: TimeSlot[];
  timeZone: string;
  showPrice: boolean;
  onClear?: () => void;
  className?: string;
  nowMs: number;
  cartedStartTimes?: Set<string>;
  selectedDayKey?: string;
  showDaySeparators: boolean;
}) {
  const { pointerUp, setHoveredIdx } = useRangeSelection(
    useShallow((s) => ({
      pointerUp: s.pointerUp,
      setHoveredIdx: s.setHoveredIdx,
    })),
  );

  const isDragging = useRangeSelection((s) => s.anchorIdx !== null);
  const hasSelection = useRangeSelection(
    (s) => s.committedRange !== null || s.anchorIdx !== null,
  );

  return (
    <div
      className={cn("space-y-3 select-none", className)}
      onPointerLeave={() => {
        if (isDragging) pointerUp();
        setHoveredIdx(null);
      }}
    >
      <SummaryBar
        slots={slots}
        timeZone={timeZone}
        showPrice={showPrice}
        onClear={onClear}
      />

      {!hasSelection && (
        <p className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-muted-foreground md:hidden">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Tap and hold to select
        </p>
      )}

      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        {slots.map((slot, idx) => {
          const slotDayKey = getZonedDayKey(slot.startTime, timeZone);
          const previousSlot = idx > 0 ? slots[idx - 1] : undefined;
          const previousDayKey = previousSlot
            ? getZonedDayKey(previousSlot.startTime, timeZone)
            : undefined;
          const shouldRenderDayHeader =
            showDaySeparators && slotDayKey !== previousDayKey;
          const dayHeaderLabel = formatInTimeZone(
            slot.startTime,
            timeZone,
            "EEE, MMM d",
          );
          const dayContextLabel =
            selectedDayKey && slotDayKey !== selectedDayKey
              ? dayHeaderLabel
              : undefined;

          return (
            <React.Fragment key={slot.id}>
              {shouldRenderDayHeader && (
                <div className="border-b border-border/50 bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  {dayHeaderLabel}
                </div>
              )}
              <TimeSlotRow
                idx={idx}
                slot={slot}
                timeZone={timeZone}
                dayContextLabel={dayContextLabel}
                showPrice={showPrice}
                isPast={Date.parse(slot.startTime) < nowMs}
                isInCart={
                  cartedStartTimes?.has(String(Date.parse(slot.startTime))) ??
                  false
                }
              />
            </React.Fragment>
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
