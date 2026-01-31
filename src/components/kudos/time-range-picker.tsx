"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";
import { useShallow } from "zustand/shallow";
import { formatCurrency, formatTimeInTimeZone } from "@/common/format";
import { cn } from "@/lib/utils";
import {
  type RangeSelectionConfig,
  RangeSelectionProvider,
  useCellState,
  useRangeSelection,
} from "./range-selection";
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
  onContinue?: () => void;
  continueLabel?: string;
  className?: string;
  currentTimeISO?: string;
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
  for (let i = startIdx; i <= endIdx; i++) {
    if (!isSlotAvailable(slots[i])) return null;
  }
  const slotCount = endIdx - startIdx + 1;
  if (slotCount * SLOT_STEP_MINUTES > MAX_DURATION_MINUTES) return null;
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

// ---------------------------------------------------------------------------
// Summary Bar
// ---------------------------------------------------------------------------

interface SummaryBarProps {
  slots: TimeSlot[];
  timeZone: string;
  showPrice: boolean;
  onClear?: () => void;
  onContinue?: () => void;
  continueLabel: string;
}

const SummaryBar = React.memo(function SummaryBar({
  slots,
  timeZone,
  showPrice,
  onClear,
  onContinue,
  continueLabel,
}: SummaryBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.15, ease: "easeOut" as const };

  const activeStartIdx = useRangeSelection((s) => {
    const { anchorIdx, hoverIdx, committedRange, config } = s;
    if (anchorIdx !== null && hoverIdx !== null) {
      const clamped = config.clampToContiguous(anchorIdx, hoverIdx);
      const r = config.computeRange(anchorIdx, clamped);
      return r?.startIdx ?? committedRange?.startIdx ?? null;
    }
    return committedRange?.startIdx ?? null;
  });
  const activeEndIdx = useRangeSelection((s) => {
    const { anchorIdx, hoverIdx, committedRange, config } = s;
    if (anchorIdx !== null && hoverIdx !== null) {
      const clamped = config.clampToContiguous(anchorIdx, hoverIdx);
      const r = config.computeRange(anchorIdx, clamped);
      return r?.endIdx ?? committedRange?.endIdx ?? null;
    }
    return committedRange?.endIdx ?? null;
  });
  const isAwaitingEndClick = useRangeSelection((s) => {
    const { anchorIdx, committedRange } = s;
    return (
      committedRange !== null &&
      committedRange.startIdx === committedRange.endIdx &&
      anchorIdx === null
    );
  });

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
            {onContinue &&
              !isAwaitingEndClick &&
              activeStartIdx !== activeEndIdx && (
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
// Slot Row
// ---------------------------------------------------------------------------

interface TimeSlotRowProps {
  idx: number;
  slot: TimeSlot;
  timeZone: string;
  showPrice: boolean;
  isPast?: boolean;
}

const TimeSlotRow = React.memo(function TimeSlotRow({
  idx,
  slot,
  timeZone,
  showPrice,
  isPast,
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

  const available = isSlotAvailable(slot) && !isPast;
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
      aria-label={`${startLabel} to ${endLabel}${!available ? " (unavailable)" : ""}`}
      className={cn(
        "group flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150",
        "touch-none appearance-none",
        "border-b border-border/50 last:border-b-0",
        available &&
          !inRange &&
          !inHoverPreview &&
          "bg-success-light/20 hover:bg-success-light/50 cursor-pointer",
        inHoverPreview && "bg-primary/5 cursor-pointer",
        inRange && "bg-primary/8 relative",
        isReserved && "bg-destructive-light/40 cursor-not-allowed",
        isMaintenance && "bg-warning-light/50 cursor-not-allowed",
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        pointerDown(idx);
      }}
      onPointerEnter={() => {
        pointerEnter(idx);
        if (available) setHoveredIdx(idx);
      }}
      onPointerLeave={() => setHoveredIdx(null)}
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
  showPrice = true,
  onChange,
  onClear,
  onContinue,
  continueLabel = "Continue to review",
  className,
  currentTimeISO,
}: TimeRangePickerProps) {
  // Compute committed range from props
  const committedRange = React.useMemo(() => {
    if (!selectedStartTime || !selectedDurationMinutes) return null;
    const startIdx = slots.findIndex((s) => s.startTime === selectedStartTime);
    if (startIdx === -1) return null;
    const slotCount = selectedDurationMinutes / SLOT_STEP_MINUTES;
    const endIdx = startIdx + slotCount - 1;
    if (endIdx >= slots.length) return null;
    return { startIdx, endIdx };
  }, [selectedStartTime, selectedDurationMinutes, slots]);

  // Build config — stable reference via useMemo
  const config = React.useMemo<RangeSelectionConfig>(
    () => ({
      isCellAvailable: (idx) => {
        const slot = slots[idx];
        return slot ? isSlotAvailable(slot) : false;
      },
      computeRange: (anchorIdx, targetIdx) =>
        computeContiguousRange(slots, anchorIdx, targetIdx),
      clampToContiguous: (anchorIdx, targetIdx) =>
        clampToContiguous(slots, anchorIdx, targetIdx),
      commitRange: (startIdx, endIdx) => {
        const startSlot = slots[startIdx];
        if (!startSlot) return;
        const slotCount = endIdx - startIdx + 1;
        onChange?.({
          startTime: startSlot.startTime,
          durationMinutes: slotCount * SLOT_STEP_MINUTES,
        });
      },
    }),
    [slots, onChange],
  );

  return (
    <RangeSelectionProvider config={config} committedRange={committedRange}>
      <TimeRangePickerInner
        slots={slots}
        timeZone={timeZone}
        showPrice={showPrice}
        onClear={onClear}
        onContinue={onContinue}
        continueLabel={continueLabel}
        className={className}
        currentTimeISO={currentTimeISO}
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
  onContinue,
  continueLabel,
  className,
  currentTimeISO,
}: {
  slots: TimeSlot[];
  timeZone: string;
  showPrice: boolean;
  onClear?: () => void;
  onContinue?: () => void;
  continueLabel: string;
  className?: string;
  currentTimeISO?: string;
}) {
  const { pointerUp, setHoveredIdx } = useRangeSelection(
    useShallow((s) => ({
      pointerUp: s.pointerUp,
      setHoveredIdx: s.setHoveredIdx,
    })),
  );

  const isDragging = useRangeSelection((s) => s.anchorIdx !== null);

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
        onContinue={onContinue}
        continueLabel={continueLabel}
      />

      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        {slots.map((slot, idx) => (
          <TimeSlotRow
            key={slot.id}
            idx={idx}
            slot={slot}
            timeZone={timeZone}
            showPrice={showPrice}
            isPast={currentTimeISO ? slot.startTime < currentTimeISO : false}
          />
        ))}
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
