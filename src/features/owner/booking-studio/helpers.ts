import { addDays } from "date-fns";
import { formatInTimeZone } from "@/common/format";
import { getZonedDayKey, getZonedDayRangeFromDayKey } from "@/common/time-zone";
import type { RangeSelectionConfig } from "@/components/kudos/range-selection";
import {
  buildOpenCellIndexSet,
  type CourtHoursWindow,
  getWindowsForDayOfWeek,
} from "@/features/owner/components/booking-studio/court-hours";
import {
  type CourtBlockItem,
  DRAFT_STATUS_PRIORITY,
  type DraftRowItem,
  type DraftRowStatus,
  getEndMinuteForDayKey,
  getMinuteOfDay,
  type ReservationItem,
  TIMELINE_ROW_HEIGHT,
} from "@/features/owner/components/booking-studio/types";

export type TimelineBlockSegment = {
  block: CourtBlockItem;
  topOffset: number;
  height: number;
};

export type TimelineReservationSegment = {
  reservation: ReservationItem;
  topOffset: number;
  height: number;
};

export type DraftTimelineSegment = {
  row: DraftRowItem;
  topOffset: number;
  height: number;
};

export const getWeekStartDayKey = (
  dayKey: string,
  timeZone: string,
  weekStartsOn = 0,
) => {
  const dayStart = getZonedDayRangeFromDayKey(dayKey, timeZone).start;
  const dayOfWeek = dayStart.getDay();
  const delta = (dayOfWeek - weekStartsOn + 7) % 7;
  const weekStart = addDays(dayStart, -delta);
  return getZonedDayKey(weekStart, timeZone);
};

export const getWeekDayKeys = (weekStartDayKey: string, timeZone: string) => {
  const start = getZonedDayRangeFromDayKey(weekStartDayKey, timeZone).start;
  return Array.from({ length: 7 }, (_, index) =>
    getZonedDayKey(addDays(start, index), timeZone),
  );
};

export const getWeekLabel = (
  weekDayKeys: string[],
  weekStartDayKey: string,
  timeZone: string,
) => {
  const weekStart = getZonedDayRangeFromDayKey(
    weekDayKeys[0] ?? weekStartDayKey,
    timeZone,
  ).start;
  const weekEnd = getZonedDayRangeFromDayKey(
    weekDayKeys[6] ?? weekStartDayKey,
    timeZone,
  ).start;
  return `${formatInTimeZone(weekStart, timeZone, "MMM d")} - ${formatInTimeZone(
    weekEnd,
    timeZone,
    "MMM d, yyyy",
  )}`;
};

export const buildBlocksRange = (options: {
  dayKey: string;
  visibleDayKeys: string[];
  timeZone: string;
}) => {
  const { dayKey, visibleDayKeys, timeZone } = options;
  const startDayKey = visibleDayKeys[0] ?? dayKey;
  const endDayKey = visibleDayKeys[visibleDayKeys.length - 1] ?? dayKey;
  return {
    start: getZonedDayRangeFromDayKey(startDayKey, timeZone).start,
    end: getZonedDayRangeFromDayKey(endDayKey, timeZone).end,
  };
};

// ---------------------------------------------------------------------------
// Hour-indexed timeline positioning
// ---------------------------------------------------------------------------

const buildHourToRow = (hours: number[]): Map<number, number> => {
  const map = new Map<number, number>();
  for (let i = 0; i < hours.length; i++) {
    map.set(hours[i] as number, i);
  }
  return map;
};

/**
 * Converts a minute-of-day value to a fractional grid-row position.
 *
 * Returns `null` when the minute falls inside a gap (hour not in the grid).
 * Returns `hoursCount` for minute 1440 when hour 0 is not in the grid
 * (i.e. "end of the visible grid").
 */
const minuteToGridPosition = (
  minute: number,
  hourToRow: Map<number, number>,
  hoursCount: number,
): number | null => {
  // 1440 = "24:00" = midnight boundary of the next calendar day.
  if (minute >= 1440) {
    const row0 = hourToRow.get(0);
    if (row0 === undefined) return hoursCount;
    // Only map to hour-0's row when it appears AFTER hour 23 in the grid
    // (overnight layout like [6,…,23,0,1,2]). Otherwise 1440 means
    // "end of the visible grid" to avoid negative-height segments.
    const row23 = hourToRow.get(23);
    if (row23 !== undefined && row0 > row23) return row0;
    return hoursCount;
  }
  const hour = Math.floor(minute / 60);
  const row = hourToRow.get(hour);
  if (row === undefined) return null;
  return row + (minute % 60) / 60;
};

const getTimelineSegment = (options: {
  startTime: Date;
  endTime: Date;
  dayKey: string;
  dayStart: Date;
  timeZone: string;
  hours: number[];
}) => {
  const { startTime, endTime, dayKey, dayStart, timeZone, hours } = options;
  const dayEndExclusive = addDays(dayStart, 1);

  if (startTime >= dayEndExclusive || endTime <= dayStart) {
    return null;
  }

  const segmentStart = startTime > dayStart ? startTime : dayStart;
  const segmentEnd = endTime < dayEndExclusive ? endTime : dayEndExclusive;
  const startMinute = getMinuteOfDay(segmentStart, timeZone);
  const endMinute = getEndMinuteForDayKey(dayKey, segmentEnd, timeZone);

  if (hours.length === 0) return null;

  const hourToRow = buildHourToRow(hours);

  const startPos = minuteToGridPosition(startMinute, hourToRow, hours.length);
  if (startPos === null) return null;

  const endPos = minuteToGridPosition(endMinute, hourToRow, hours.length);
  // If end falls in a gap hour, clamp to the end of the grid.
  const clampedEndPos = endPos ?? hours.length;

  const height = (clampedEndPos - startPos) * TIMELINE_ROW_HEIGHT;
  if (height <= 0) return null;

  const topOffset = startPos * TIMELINE_ROW_HEIGHT;
  return { topOffset, height };
};

// ---------------------------------------------------------------------------
// Day-level builders
// ---------------------------------------------------------------------------

export const buildTimelineBlocksForDay = (options: {
  blocks: CourtBlockItem[];
  dayKey: string;
  dayStart: Date;
  timeZone: string;
  hours: number[];
}) => {
  const { blocks, dayKey, dayStart, timeZone, hours } = options;

  return blocks
    .map((block) => {
      const segment = getTimelineSegment({
        startTime: new Date(block.startTime),
        endTime: new Date(block.endTime),
        dayKey,
        dayStart,
        timeZone,
        hours,
      });
      return segment ? { block, ...segment } : null;
    })
    .filter((item): item is TimelineBlockSegment => Boolean(item));
};

export const buildTimelineReservationsForDay = (options: {
  reservations: ReservationItem[];
  dayKey: string;
  dayStart: Date;
  timeZone: string;
  hours: number[];
}) => {
  const { reservations, dayKey, dayStart, timeZone, hours } = options;

  return reservations
    .map((reservation) => {
      const segment = getTimelineSegment({
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime),
        dayKey,
        dayStart,
        timeZone,
        hours,
      });
      return segment ? { reservation, ...segment } : null;
    })
    .filter((item): item is TimelineReservationSegment => Boolean(item));
};

// ---------------------------------------------------------------------------
// Week-level builders
// ---------------------------------------------------------------------------

export const buildWeekTimelineBlocksByDayKey = (options: {
  blocks: CourtBlockItem[];
  weekDayKeys: string[];
  timeZone: string;
  hours: number[];
}) => {
  const { blocks, weekDayKeys, timeZone, hours } = options;
  const byDayKey = new Map<string, TimelineBlockSegment[]>();

  for (const dayKey of weekDayKeys) {
    const dayStart = getZonedDayRangeFromDayKey(dayKey, timeZone).start;
    const items = buildTimelineBlocksForDay({
      blocks,
      dayKey,
      dayStart,
      timeZone,
      hours,
    });
    byDayKey.set(dayKey, items);
  }

  return byDayKey;
};

export const buildWeekTimelineReservationsByDayKey = (options: {
  reservations: ReservationItem[];
  weekDayKeys: string[];
  timeZone: string;
  hours: number[];
}) => {
  const { reservations, weekDayKeys, timeZone, hours } = options;
  const byDayKey = new Map<string, TimelineReservationSegment[]>();

  for (const dayKey of weekDayKeys) {
    const dayStart = getZonedDayRangeFromDayKey(dayKey, timeZone).start;
    const items = buildTimelineReservationsForDay({
      reservations,
      dayKey,
      dayStart,
      timeZone,
      hours,
    });
    byDayKey.set(dayKey, items);
  }

  return byDayKey;
};

export const buildDraftTimelineBlocksForDay = (options: {
  draftRows: DraftRowItem[];
  dayKey: string;
  dayStart: Date;
  timeZone: string;
  hours: number[];
  courtId?: string;
}) => {
  const { draftRows, dayKey, dayStart, timeZone, hours, courtId } = options;

  return draftRows
    .filter((row) => row.status !== "COMMITTED" && row.status !== "SKIPPED")
    .filter((row) => row.startTime && row.endTime)
    .filter((row) => (courtId ? row.courtId === courtId : true))
    .map((row) => {
      const segment = getTimelineSegment({
        startTime: new Date(row.startTime as Date | string),
        endTime: new Date(row.endTime as Date | string),
        dayKey,
        dayStart,
        timeZone,
        hours,
      });
      return segment ? { row, ...segment } : null;
    })
    .filter((item): item is DraftTimelineSegment => Boolean(item));
};

export const buildDraftWeekTimelineBlocksByDayKey = (options: {
  draftRows: DraftRowItem[];
  weekDayKeys: string[];
  timeZone: string;
  hours: number[];
  courtId?: string;
}) => {
  const { draftRows, weekDayKeys, timeZone, hours, courtId } = options;
  const byDayKey = new Map<string, DraftTimelineSegment[]>();

  for (const dayKey of weekDayKeys) {
    const dayStart = getZonedDayRangeFromDayKey(dayKey, timeZone).start;
    const items = buildDraftTimelineBlocksForDay({
      draftRows,
      dayKey,
      dayStart,
      timeZone,
      hours,
      courtId,
    });
    byDayKey.set(dayKey, items);
  }

  return byDayKey;
};

// ---------------------------------------------------------------------------
// Day selection config (range-selection for owner timeline)
// ---------------------------------------------------------------------------

export const buildDaySelectionConfig = (options: {
  timelineBlocks: TimelineBlockSegment[];
  timelineReservations: TimelineReservationSegment[];
  hours: number[];
  dayOfWeek: number;
  courtHours: CourtHoursWindow[];
  onCommitRange: (startIdx: number, endIdx: number) => void;
}) => {
  const {
    timelineBlocks,
    timelineReservations,
    hours,
    dayOfWeek,
    courtHours,
    onCommitRange,
  } = options;

  // Derive blocked indices from the day-clipped segment positions
  // (topOffset/height already handle overnight boundaries correctly)
  const blockedHourIndices = new Set<number>();
  for (const { topOffset, height } of timelineBlocks) {
    const startIdx = Math.floor(topOffset / TIMELINE_ROW_HEIGHT);
    const endIdx = Math.ceil((topOffset + height) / TIMELINE_ROW_HEIGHT);
    for (let i = startIdx; i < endIdx; i++) {
      blockedHourIndices.add(i);
    }
  }

  for (const { topOffset, height } of timelineReservations) {
    const startIdx = Math.floor(topOffset / TIMELINE_ROW_HEIGHT);
    const endIdx = Math.ceil((topOffset + height) / TIMELINE_ROW_HEIGHT);
    for (let i = startIdx; i < endIdx; i++) {
      blockedHourIndices.add(i);
    }
  }

  const closedHourIndices = new Set<number>();
  if (courtHours.length > 0) {
    const dayWindows = getWindowsForDayOfWeek(courtHours, dayOfWeek);
    const openCellIndices = buildOpenCellIndexSet({
      windowsForDay: dayWindows,
      hours,
      snapMinutes: 60,
    });

    for (let i = 0; i < hours.length; i += 1) {
      if (!openCellIndices.has(i)) {
        closedHourIndices.add(i);
      }
    }
  }

  const isUnavailable = (idx: number) =>
    blockedHourIndices.has(idx) || closedHourIndices.has(idx);

  const config: RangeSelectionConfig = {
    isCellAvailable: (idx: number) =>
      idx >= 0 && idx < hours.length && !isUnavailable(idx),
    computeRange: (anchorIdx: number, targetIdx: number) => {
      const lo = Math.min(anchorIdx, targetIdx);
      const hi = Math.max(anchorIdx, targetIdx);
      for (let i = lo; i <= hi; i++) {
        if (isUnavailable(i)) return null;
      }
      return { startIdx: lo, endIdx: hi };
    },
    clampToContiguous: (anchorIdx: number, targetIdx: number) => {
      const dir = targetIdx >= anchorIdx ? 1 : -1;
      let current = anchorIdx;
      while (current !== targetIdx) {
        const next = current + dir;
        if (isUnavailable(next)) break;
        current = next;
      }
      return current;
    },
    commitRange: (startIdx: number, endIdx: number) => {
      onCommitRange(startIdx, endIdx);
    },
  };

  return config;
};

// ---------------------------------------------------------------------------
// Draft rows state
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Block CTA label
// ---------------------------------------------------------------------------

const BLOCK_CTA_LABELS: Record<
  "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING",
  string
> = {
  WALK_IN: "Save walk-in booking",
  MAINTENANCE: "Save maintenance block",
  GUEST_BOOKING: "Save guest booking",
};

export function getBlockCtaLabel(
  blockType: "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING",
  isSubmitting: boolean,
): string {
  if (isSubmitting) return "Saving...";
  return BLOCK_CTA_LABELS[blockType];
}

// ---------------------------------------------------------------------------
// Draft rows state
// ---------------------------------------------------------------------------

export type DraftRowsState = {
  draftRowsById: Map<string, DraftRowItem>;
  draftRowsByBlockId: Map<string, DraftRowItem>;
  draftRowsSorted: DraftRowItem[];
  importedBlockIds: Set<string>;
  replacedBlockIds: Set<string>;
  isImportEditable: boolean;
  canCommitImport: boolean;
  isImportCommitted: boolean;
};

export const buildDraftRowsState = (options: {
  draftRows: DraftRowItem[];
  isImportOverlay: boolean;
  job?: { status?: string | null; errorRowCount?: number | null } | null;
}): DraftRowsState => {
  const { draftRows, isImportOverlay, job } = options;
  const isImportEditable = job?.status === "NORMALIZED";
  const canCommitImport = Boolean(
    job && isImportEditable && (job.errorRowCount ?? 0) === 0,
  );
  const isImportCommitted = job?.status === "COMMITTED";

  const draftRowsById = new Map(draftRows.map((row) => [row.id, row]));
  const draftRowsByBlockId = new Map<string, DraftRowItem>();
  for (const row of draftRows) {
    if (row.courtBlockId) {
      draftRowsByBlockId.set(row.courtBlockId, row);
    }
  }

  const draftRowsSorted = [...draftRows].sort((a, b) => {
    const statusA = (a.status ?? "PENDING") as DraftRowStatus;
    const statusB = (b.status ?? "PENDING") as DraftRowStatus;
    const priorityA = DRAFT_STATUS_PRIORITY[statusA] ?? 99;
    const priorityB = DRAFT_STATUS_PRIORITY[statusB] ?? 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.lineNumber - b.lineNumber;
  });

  const importedBlockIds = new Set<string>();
  const replacedBlockIds = new Set<string>();
  if (isImportOverlay) {
    for (const row of draftRows) {
      if (row.courtBlockId && row.status === "COMMITTED") {
        importedBlockIds.add(row.courtBlockId as string);
      }
      if (row.courtBlockId && row.replacedAt) {
        replacedBlockIds.add(row.courtBlockId as string);
      }
    }
  }

  return {
    draftRowsById,
    draftRowsByBlockId,
    draftRowsSorted,
    importedBlockIds,
    replacedBlockIds,
    isImportEditable,
    canCommitImport,
    isImportCommitted,
  };
};
