import {
  getZonedDate,
  getZonedDayRangeFromDayKey,
} from "@/shared/lib/time-zone";
import { DEFAULT_END_HOUR, DEFAULT_START_HOUR } from "./types";

export type CourtHoursWindow = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

const clampHour = (value: number) => Math.min(24, Math.max(0, value));

export const getDayOfWeekForDayKey = (dayKey: string, timeZone: string) => {
  const start = getZonedDayRangeFromDayKey(dayKey, timeZone).start;
  return getZonedDate(start, timeZone).getDay();
};

export const getWindowsForDayOfWeek = (
  windows: CourtHoursWindow[],
  dayOfWeek: number,
) => windows.filter((window) => window.dayOfWeek === dayOfWeek);

export const getTimelineRangeForDayOrNull = (
  windows: CourtHoursWindow[],
  dayOfWeek: number,
) => {
  const dayWindows = getWindowsForDayOfWeek(windows, dayOfWeek);
  if (dayWindows.length === 0) return null;

  let minStartMinute = dayWindows[0]?.startMinute ?? 0;
  let maxEndMinute = dayWindows[0]?.endMinute ?? 0;

  for (const window of dayWindows) {
    if (window.startMinute < minStartMinute) {
      minStartMinute = window.startMinute;
    }
    if (window.endMinute > maxEndMinute) {
      maxEndMinute = window.endMinute;
    }
  }

  const startHour = clampHour(Math.floor(minStartMinute / 60));
  const endHour = clampHour(Math.ceil(maxEndMinute / 60));

  if (endHour <= startHour) return null;

  return { startHour, endHour };
};

export const getTimelineRangeForWeek = (
  windows: CourtHoursWindow[],
  weekDayKeys: string[],
  timeZone: string,
) => {
  let minStartMinute: number | null = null;
  let maxEndMinute: number | null = null;

  for (const dayKey of weekDayKeys) {
    const dayOfWeek = getDayOfWeekForDayKey(dayKey, timeZone);
    const dayWindows = getWindowsForDayOfWeek(windows, dayOfWeek);
    if (dayWindows.length === 0) continue;

    for (const window of dayWindows) {
      if (minStartMinute === null || window.startMinute < minStartMinute) {
        minStartMinute = window.startMinute;
      }
      if (maxEndMinute === null || window.endMinute > maxEndMinute) {
        maxEndMinute = window.endMinute;
      }
    }
  }

  if (minStartMinute === null || maxEndMinute === null) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }

  const startHour = clampHour(Math.floor(minStartMinute / 60));
  const endHour = clampHour(Math.ceil(maxEndMinute / 60));

  if (endHour <= startHour) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }

  return { startHour, endHour };
};

export const buildOpenCellIndexSet = ({
  windowsForDay,
  axisStartHour,
  cellCount,
  snapMinutes = 60,
}: {
  windowsForDay: CourtHoursWindow[];
  axisStartHour: number;
  cellCount: number;
  snapMinutes?: number;
}) => {
  const openCellIndices = new Set<number>();
  if (cellCount <= 0 || windowsForDay.length === 0) return openCellIndices;

  const axisStartMinute = axisStartHour * 60;

  for (let index = 0; index < cellCount; index += 1) {
    const slotStart = axisStartMinute + index * snapMinutes;
    const slotEnd = slotStart + snapMinutes;
    const isOpen = windowsForDay.some(
      (window) =>
        window.startMinute <= slotStart && window.endMinute >= slotEnd,
    );
    if (isOpen) {
      openCellIndices.add(index);
    }
  }

  return openCellIndices;
};
