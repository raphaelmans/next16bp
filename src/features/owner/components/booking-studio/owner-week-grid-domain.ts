import type { RangeSelectionConfig } from "@/components/kudos/range-selection";
import {
  buildOpenCellIndexSet,
  type CourtHoursWindow,
  getDayOfWeekForDayKey,
  getWindowsForDayOfWeek,
} from "./court-hours";
import type { CourtBlockItem, ReservationItem } from "./types";
import { COMPACT_TIMELINE_ROW_HEIGHT, TIMELINE_ROW_HEIGHT } from "./types";

// ---------------------------------------------------------------------------
// Linear ↔ day-column index helpers
// ---------------------------------------------------------------------------

export function linearToDayIndex(
  linearIdx: number,
  hoursPerDay: number,
): { dayColIdx: number; hourIdx: number } {
  return {
    dayColIdx: Math.floor(linearIdx / hoursPerDay),
    hourIdx: linearIdx % hoursPerDay,
  };
}

export function dayToLinearIndex(
  dayColIdx: number,
  hourIdx: number,
  hoursPerDay: number,
): number {
  return dayColIdx * hoursPerDay + hourIdx;
}

// ---------------------------------------------------------------------------
// Blocked cell set
// ---------------------------------------------------------------------------

type OverlaySegment = { topOffset: number; height: number };

export function buildOwnerBlockedCellSet(
  overlays: OverlaySegment[],
  rowHeight: number,
): Set<number> {
  const blocked = new Set<number>();
  for (const { topOffset, height } of overlays) {
    const startIdx = Math.floor(topOffset / rowHeight);
    const endIdx = Math.ceil((topOffset + height) / rowHeight);
    for (let i = startIdx; i < endIdx; i++) {
      blocked.add(i);
    }
  }
  return blocked;
}

// ---------------------------------------------------------------------------
// Selection config builder
// ---------------------------------------------------------------------------

export type OwnerSelectionConfigArgs = {
  weekDayKeys: string[];
  hours: number[];
  timeZone: string;
  blocksByDay: Map<string, OverlaySegment[]>;
  reservationsByDay: Map<string, OverlaySegment[]>;
  courtHoursWindows: CourtHoursWindow[];
  compact: boolean;
  onCommitRange: (
    startDayKey: string,
    startHourIdx: number,
    endDayKey: string,
    endHourIdx: number,
  ) => void;
  onClear?: () => void;
};

export function buildOwnerSelectionConfig(
  args: OwnerSelectionConfigArgs,
): RangeSelectionConfig {
  const {
    weekDayKeys,
    hours,
    timeZone,
    blocksByDay,
    reservationsByDay,
    courtHoursWindows,
    compact,
    onCommitRange,
    onClear,
  } = args;

  const hoursPerDay = hours.length;
  const rowHeight = compact ? COMPACT_TIMELINE_ROW_HEIGHT : TIMELINE_ROW_HEIGHT;

  // Pre-compute unavailable linear indices
  const unavailable = new Set<number>();

  for (let dayColIdx = 0; dayColIdx < weekDayKeys.length; dayColIdx++) {
    const dk = weekDayKeys[dayColIdx] as string;

    // Blocked by existing blocks/reservations
    const blocks = blocksByDay.get(dk) ?? [];
    const reservations = reservationsByDay.get(dk) ?? [];
    const dayBlocked = buildOwnerBlockedCellSet(
      [...blocks, ...reservations],
      rowHeight,
    );
    for (const hourIdx of dayBlocked) {
      unavailable.add(dayToLinearIndex(dayColIdx, hourIdx, hoursPerDay));
    }

    // Closed by court hours
    if (courtHoursWindows.length > 0) {
      const dayOfWeek = getDayOfWeekForDayKey(dk, timeZone);
      const dayWindows = getWindowsForDayOfWeek(courtHoursWindows, dayOfWeek);
      const openCells = buildOpenCellIndexSet({
        windowsForDay: dayWindows,
        hours,
        snapMinutes: 60,
      });
      for (let i = 0; i < hoursPerDay; i++) {
        if (!openCells.has(i)) {
          unavailable.add(dayToLinearIndex(dayColIdx, i, hoursPerDay));
        }
      }
    }
  }

  const isUnavailable = (idx: number) => unavailable.has(idx);

  return {
    isCellAvailable: (idx) => {
      if (idx < 0 || idx >= hoursPerDay * weekDayKeys.length) return false;
      return !isUnavailable(idx);
    },
    computeRange: (anchorIdx, targetIdx) => {
      const a = linearToDayIndex(anchorIdx, hoursPerDay);
      const t = linearToDayIndex(targetIdx, hoursPerDay);
      // Allow same-day and adjacent-day (cross-midnight) selection
      if (Math.abs(a.dayColIdx - t.dayColIdx) > 1) return null;

      const lo = Math.min(anchorIdx, targetIdx);
      const hi = Math.max(anchorIdx, targetIdx);
      // Cap at hoursPerDay slots (one full day equivalent)
      if (hi - lo + 1 > hoursPerDay) return null;
      for (let i = lo; i <= hi; i++) {
        if (isUnavailable(i)) return null;
      }
      return { startIdx: lo, endIdx: hi };
    },
    clampToContiguous: (anchorIdx, targetIdx) => {
      const a = linearToDayIndex(anchorIdx, hoursPerDay);
      const t = linearToDayIndex(targetIdx, hoursPerDay);
      // Allow same-day and adjacent-day (cross-midnight)
      if (Math.abs(a.dayColIdx - t.dayColIdx) > 1) return anchorIdx;

      const dir = targetIdx >= anchorIdx ? 1 : -1;
      let current = anchorIdx;
      while (current !== targetIdx) {
        const next = current + dir;
        if (isUnavailable(next)) break;
        // Cap at hoursPerDay slots
        const span =
          Math.abs(next - anchorIdx) + 1;
        if (span > hoursPerDay) break;
        current = next;
      }
      return current;
    },
    commitRange: (startIdx, endIdx) => {
      const start = linearToDayIndex(startIdx, hoursPerDay);
      const end = linearToDayIndex(endIdx, hoursPerDay);
      const startDk = weekDayKeys[start.dayColIdx];
      const endDk = weekDayKeys[end.dayColIdx];
      if (!startDk || !endDk) return;
      onCommitRange(startDk, start.hourIdx, endDk, end.hourIdx);
    },
    onClear,
  };
}
