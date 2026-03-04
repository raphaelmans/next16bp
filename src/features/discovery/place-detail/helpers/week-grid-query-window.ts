import {
  getZonedDayKey,
  getZonedDayRangeForInstant,
  getZonedStartOfDayIso,
  toUtcISOString,
} from "@/common/time-zone";
import { parseDayKeyToDate } from "@/features/discovery/helpers";
import { isWithinAdjacentWeek } from "@/features/discovery/place-detail/helpers/date-adjacency";

type WeekGridQueryWindowParams = {
  weekDayKeys: string[];
  selectedDayKey: string;
  selectedStartTime?: string;
  timeZone: string;
  todayRangeStart: Date;
  maxBookingDate: Date;
};

type WeekGridQueryWindow = {
  startDateIso: string;
  endDateIso: string;
};

export function getWeekGridQueryWindow({
  weekDayKeys,
  selectedDayKey,
  selectedStartTime,
  timeZone,
  todayRangeStart,
  maxBookingDate,
}: WeekGridQueryWindowParams): WeekGridQueryWindow {
  const weekStart = parseDayKeyToDate(
    weekDayKeys[0] ?? selectedDayKey,
    timeZone,
  );
  const weekEnd = getZonedDayRangeForInstant(
    parseDayKeyToDate(weekDayKeys[6] ?? selectedDayKey, timeZone),
    timeZone,
  ).end;

  let start = weekStart;
  let end = weekEnd;

  const anchorStartTimeIso = selectedStartTime ?? null;
  const anchorDayKey = anchorStartTimeIso
    ? getZonedDayKey(anchorStartTimeIso, timeZone)
    : null;
  if (
    anchorStartTimeIso &&
    anchorDayKey &&
    !weekDayKeys.includes(anchorDayKey) &&
    isWithinAdjacentWeek({
      selectedStartTimeIso: anchorStartTimeIso,
      candidateDayKey: anchorDayKey,
      timeZone,
    })
  ) {
    const anchorStart = parseDayKeyToDate(anchorDayKey, timeZone);
    const anchorEnd = getZonedDayRangeForInstant(anchorStart, timeZone).end;
    if (anchorStart < start) start = anchorStart;
    if (anchorEnd > end) end = anchorEnd;
  }

  const clampedStart = start < todayRangeStart ? todayRangeStart : start;
  const maxEnd = getZonedDayRangeForInstant(maxBookingDate, timeZone).end;
  const clampedEnd = end > maxEnd ? maxEnd : end;

  return {
    startDateIso: toUtcISOString(clampedStart),
    endDateIso: toUtcISOString(clampedEnd),
  };
}

type SelectionSummaryQueryWindowParams = {
  selectedStartTime?: string;
  durationMinutes: number;
  timeZone: string;
};

type SelectionSummaryQueryWindow = {
  startDateIso: string;
  endDateIso: string;
};

export function getSelectionSummaryQueryWindow({
  selectedStartTime,
  durationMinutes,
  timeZone,
}: SelectionSummaryQueryWindowParams): SelectionSummaryQueryWindow {
  if (!selectedStartTime) {
    return { startDateIso: "", endDateIso: "" };
  }

  const selectionEnd = new Date(
    Date.parse(selectedStartTime) + durationMinutes * 60_000,
  );

  return {
    startDateIso: getZonedStartOfDayIso(new Date(selectedStartTime), timeZone),
    endDateIso: toUtcISOString(
      getZonedDayRangeForInstant(selectionEnd, timeZone).end,
    ),
  };
}
