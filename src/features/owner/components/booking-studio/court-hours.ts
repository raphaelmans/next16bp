import { sortHoursInScheduleOrder } from "@/common/schedule-hours";
import { getZonedDate, getZonedDayRangeFromDayKey } from "@/common/time-zone";
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

// ---------------------------------------------------------------------------
// Hours-based operating hours (overnight-safe)
// ---------------------------------------------------------------------------

const collectHoursFromWindows = (
  dayWindows: CourtHoursWindow[],
  hourSet: Set<number>,
) => {
  for (const window of dayWindows) {
    const startHour = Math.floor(window.startMinute / 60);
    const endHour = Math.ceil(window.endMinute / 60);
    for (let h = startHour; h < endHour; h++) {
      hourSet.add(h % 24);
    }
  }
};

const defaultHours = (): number[] =>
  Array.from(
    { length: DEFAULT_END_HOUR - DEFAULT_START_HOUR },
    (_, i) => DEFAULT_START_HOUR + i,
  );

export const getOperatingHoursForDay = (
  windows: CourtHoursWindow[],
  dayOfWeek: number,
): number[] => {
  const hourSet = new Set<number>();
  const dayWindows = getWindowsForDayOfWeek(windows, dayOfWeek);
  collectHoursFromWindows(dayWindows, hourSet);
  if (hourSet.size === 0) return defaultHours();
  return sortHoursInScheduleOrder(Array.from(hourSet));
};

export const getOperatingHoursForWeek = (
  windows: CourtHoursWindow[],
  weekDayKeys: string[],
  timeZone: string,
): number[] => {
  const hourSet = new Set<number>();

  for (const dayKey of weekDayKeys) {
    const dayOfWeek = getDayOfWeekForDayKey(dayKey, timeZone);
    const dayWindows = getWindowsForDayOfWeek(windows, dayOfWeek);
    collectHoursFromWindows(dayWindows, hourSet);
  }

  if (hourSet.size === 0) return defaultHours();
  return sortHoursInScheduleOrder(Array.from(hourSet));
};

// ---------------------------------------------------------------------------
// Open cell detection
// ---------------------------------------------------------------------------

export const buildOpenCellIndexSet = ({
  windowsForDay,
  hours,
  snapMinutes = 60,
}: {
  windowsForDay: CourtHoursWindow[];
  hours: number[];
  snapMinutes?: number;
}) => {
  const openCellIndices = new Set<number>();
  if (hours.length === 0 || windowsForDay.length === 0) return openCellIndices;

  for (let index = 0; index < hours.length; index += 1) {
    const slotStart = (hours[index] as number) * 60;
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
