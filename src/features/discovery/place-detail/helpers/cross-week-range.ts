import { getZonedDayKey } from "@/common/time-zone";
import type { TimeSlot } from "@/components/kudos";

const SLOT_DURATION_MINUTES = 60;
const SLOT_DURATION_MS = SLOT_DURATION_MINUTES * 60_000;
const MAX_DURATION_MINUTES = 24 * 60;

type TimeRangeSelection = {
  startTime: string;
  durationMinutes: number;
};

type ResolveCourtRangeAcrossWeekBoundaryOptions = {
  selectedStartTime?: string;
  incomingRange: TimeRangeSelection;
  visibleWeekDayKeys: string[];
  slotsByDay: Map<string, TimeSlot[]>;
  timeZone: string;
  nowMs: number;
};

/**
 * When the preserved start sits outside the currently visible week, treat a
 * newly committed visible-week range as an END candidate and merge from the
 * preserved start if the intervening hourly slots are contiguous/selectable.
 */
export function resolveCourtRangeAcrossWeekBoundary({
  selectedStartTime,
  incomingRange,
  visibleWeekDayKeys,
  slotsByDay,
  timeZone,
  nowMs,
}: ResolveCourtRangeAcrossWeekBoundaryOptions): TimeRangeSelection {
  if (!selectedStartTime) return incomingRange;
  if (!incomingRange.startTime || incomingRange.durationMinutes <= 0) {
    return incomingRange;
  }

  const selectedStartDayKey = getZonedDayKey(selectedStartTime, timeZone);
  if (visibleWeekDayKeys.includes(selectedStartDayKey)) {
    return incomingRange;
  }

  const preservedStartMs = Date.parse(selectedStartTime);
  const incomingStartMs = Date.parse(incomingRange.startTime);
  if (!Number.isFinite(preservedStartMs) || !Number.isFinite(incomingStartMs)) {
    return incomingRange;
  }

  const incomingEndMs =
    incomingStartMs + incomingRange.durationMinutes * 60_000;
  if (!Number.isFinite(incomingEndMs) || incomingEndMs <= preservedStartMs) {
    return incomingRange;
  }

  const mergedDuration = (incomingEndMs - preservedStartMs) / 60_000;
  if (
    !Number.isInteger(mergedDuration) ||
    mergedDuration <= 0 ||
    mergedDuration > MAX_DURATION_MINUTES ||
    mergedDuration % SLOT_DURATION_MINUTES !== 0
  ) {
    return incomingRange;
  }

  const slotLookup = new Map<number, TimeSlot>();
  for (const [, daySlots] of slotsByDay) {
    for (const slot of daySlots) {
      slotLookup.set(Date.parse(slot.startTime), slot);
    }
  }

  for (
    let cursorMs = preservedStartMs;
    cursorMs < incomingEndMs;
    cursorMs += SLOT_DURATION_MS
  ) {
    const slot = slotLookup.get(cursorMs);
    if (!slot) return incomingRange;
    if (slot.status !== "available") return incomingRange;
    if (cursorMs < nowMs) return incomingRange;
  }

  return {
    startTime: selectedStartTime,
    durationMinutes: mergedDuration,
  };
}
