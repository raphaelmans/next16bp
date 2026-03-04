import { sortHoursInScheduleOrder } from "@/common/schedule-hours";
import type { TimeSlot } from "./time-slot-picker";
import {
  getHourFromSlot,
  isSameInstant,
  TIMELINE_SLOT_DURATION,
} from "./week-grid-utils";

export type WeekGridSelectionRange = {
  startTime: string;
  durationMinutes: number;
};

export type WeekGridCommittedRange = {
  startIdx: number;
  endIdx: number;
};

export type WeekGridHourModel = {
  allHours: number[];
  slotLookup: Map<string, Map<number, TimeSlot>>;
  hoursPerDay: number;
};

export function toWeekGridLinearIndex(
  dayColIdx: number,
  hourIdx: number,
  hoursPerDay: number,
): number {
  return dayColIdx * hoursPerDay + hourIdx;
}

export function buildWeekGridHourModel(
  slotsByDay: Map<string, TimeSlot[]>,
  timeZone: string,
  dayKeys?: string[],
): WeekGridHourModel {
  const hourSet = new Set<number>();
  const slotLookup = new Map<string, Map<number, TimeSlot>>();

  const keysToRender = dayKeys ?? Array.from(slotsByDay.keys());
  for (const dk of keysToRender) {
    const slots = slotsByDay.get(dk) ?? [];
    const hourMap = new Map<number, TimeSlot>();
    for (const slot of slots) {
      const hour = getHourFromSlot(slot, timeZone);
      hourSet.add(hour);
      hourMap.set(hour, slot);
    }
    slotLookup.set(dk, hourMap);
  }

  const allHours =
    hourSet.size > 0 ? sortHoursInScheduleOrder(Array.from(hourSet)) : [];

  return {
    allHours,
    slotLookup,
    hoursPerDay: allHours.length,
  };
}

export function deriveWeekGridCommittedRange(params: {
  selectedRange?: WeekGridSelectionRange;
  dayKeys: string[];
  slotLookup: Map<string, Map<number, TimeSlot>>;
  allHours: number[];
  hoursPerDay: number;
  nowMs: number;
}): WeekGridCommittedRange | null {
  const { selectedRange, dayKeys, slotLookup, allHours, hoursPerDay, nowMs } =
    params;
  if (!selectedRange) return null;
  if (hoursPerDay <= 0) return null;
  if (selectedRange.durationMinutes <= 0) return null;

  const selectionStartMs = Date.parse(selectedRange.startTime);
  if (!Number.isFinite(selectionStartMs)) return null;
  if (selectionStartMs < nowMs) return null;

  const selectionEndMs =
    selectionStartMs + selectedRange.durationMinutes * 60_000;
  if (!Number.isFinite(selectionEndMs) || selectionEndMs <= selectionStartMs) {
    return null;
  }

  // Fast-path when the selected start is visible in the rendered grid.
  for (let di = 0; di < dayKeys.length; di++) {
    const dk = dayKeys[di];
    const hourMap = slotLookup.get(dk);
    if (!hourMap) continue;

    for (let hi = 0; hi < allHours.length; hi++) {
      const slot = hourMap.get(allHours[hi]);
      if (!slot || !isSameInstant(slot.startTime, selectedRange.startTime)) {
        continue;
      }

      const count = selectedRange.durationMinutes / TIMELINE_SLOT_DURATION;
      let endDi = di;
      let endHi = hi + count - 1;
      while (endHi >= hoursPerDay) {
        endDi += 1;
        endHi -= hoursPerDay;
      }

      return {
        startIdx: toWeekGridLinearIndex(di, hi, hoursPerDay),
        endIdx: toWeekGridLinearIndex(endDi, endHi, hoursPerDay),
      };
    }
  }

  // Fallback for cross-week views: render the visible overlap so users still
  // see the selected segment after week navigation.
  let overlapStartIdx: number | null = null;
  let overlapEndIdx: number | null = null;

  for (let di = 0; di < dayKeys.length; di++) {
    const dk = dayKeys[di];
    const hourMap = slotLookup.get(dk);
    if (!hourMap) continue;

    for (let hi = 0; hi < allHours.length; hi++) {
      const slot = hourMap.get(allHours[hi]);
      if (!slot) continue;

      const slotStartMs = Date.parse(slot.startTime);
      const slotEndMs = Date.parse(slot.endTime);
      if (!Number.isFinite(slotStartMs) || !Number.isFinite(slotEndMs)) {
        continue;
      }

      const overlapsSelection =
        slotStartMs < selectionEndMs && slotEndMs > selectionStartMs;
      if (!overlapsSelection) continue;

      const idx = toWeekGridLinearIndex(di, hi, hoursPerDay);
      if (overlapStartIdx === null || idx < overlapStartIdx) {
        overlapStartIdx = idx;
      }
      if (overlapEndIdx === null || idx > overlapEndIdx) {
        overlapEndIdx = idx;
      }
    }
  }

  if (overlapStartIdx !== null && overlapEndIdx !== null) {
    return { startIdx: overlapStartIdx, endIdx: overlapEndIdx };
  }

  return null;
}
