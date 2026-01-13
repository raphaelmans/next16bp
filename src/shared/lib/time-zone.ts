import { TZDate } from "@date-fns/tz";
import { addDays, addMilliseconds, format } from "date-fns";

const DEFAULT_TIME_ZONE = "Asia/Manila";

const normalizeTimeZone = (timeZone?: string) =>
  timeZone?.trim() || DEFAULT_TIME_ZONE;

export const getZonedDate = (instant: Date | string, timeZone?: string) => {
  const parsed = typeof instant === "string" ? new Date(instant) : instant;
  return new TZDate(parsed.getTime(), normalizeTimeZone(timeZone));
};

export const getZonedDayKey = (instant: Date | string, timeZone?: string) =>
  format(getZonedDate(instant, timeZone), "yyyy-MM-dd");

export const getZonedDayRangeForInstant = (
  instant: Date | string,
  timeZone?: string,
) => {
  const tz = normalizeTimeZone(timeZone);
  const zoned = getZonedDate(instant, tz);
  const start = new TZDate(
    zoned.getFullYear(),
    zoned.getMonth(),
    zoned.getDate(),
    tz,
  );
  const end = addMilliseconds(addDays(start, 1), -1);
  return { start, end };
};

export const getZonedDayRangeFromDayKey = (
  dayKey: string,
  timeZone?: string,
) => {
  const tz = normalizeTimeZone(timeZone);
  const [year, month, day] = dayKey.split("-").map((value) => Number(value));
  const safeYear = Number.isFinite(year) ? year : 0;
  const safeMonth = Number.isFinite(month) ? month - 1 : 0;
  const safeDay = Number.isFinite(day) ? day : 1;
  const start = new TZDate(safeYear, safeMonth, safeDay, tz);
  const end = addMilliseconds(addDays(start, 1), -1);
  return { start, end };
};

export const getZonedWeekdayMinuteOfDay = (
  instant: Date | string,
  timeZone?: string,
) => {
  const zoned = getZonedDate(instant, timeZone);
  return {
    dayOfWeek: zoned.getDay(),
    minuteOfDay: zoned.getHours() * 60 + zoned.getMinutes(),
  };
};

export const getZonedStartOfDayIso = (
  instant: Date | string,
  timeZone?: string,
) => getZonedDayRangeForInstant(instant, timeZone).start.toISOString();

export const getZonedToday = (timeZone?: string) => {
  const tz = normalizeTimeZone(timeZone);
  const now = getZonedDate(new Date(), tz);
  return new TZDate(now.getFullYear(), now.getMonth(), now.getDate(), tz);
};
