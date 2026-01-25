/**
 * Date/time parsing utilities for bookings import
 */

import { TZDate } from "@date-fns/tz";
import { getZonedDate } from "@/shared/lib/time-zone";

export type DateOrder = "ymd" | "mdy" | "dmy";
export type TimeFormat = "24h" | "12h";

/**
 * Check if a datetime string has an explicit timezone offset
 */
export function hasExplicitOffset(value: string): boolean {
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
}

/**
 * Parse date components from a string
 */
export function parseDatePart(
  value: string,
  order: DateOrder,
): { year: number; month: number; day: number } | null {
  const cleaned = value.trim();
  const parts = cleaned.split(/[-/.]/).map((part) => part.trim());
  if (parts.length !== 3) return null;
  if (!parts.every((part) => part.length > 0)) return null;

  let year: number;
  let month: number;
  let day: number;

  if (parts[0].length === 4) {
    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  } else if (order === "mdy") {
    month = Number(parts[0]);
    day = Number(parts[1]);
    year = Number(parts[2]);
  } else if (order === "dmy") {
    day = Number(parts[0]);
    month = Number(parts[1]);
    year = Number(parts[2]);
  } else {
    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  }

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

/**
 * Parse time components from a string
 */
export function parseTimePart(
  value: string,
  timeFormat: TimeFormat,
): { hour: number; minute: number } | null {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return null;
  const match = cleaned.match(
    /^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?$/,
  );
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const meridiem = match[4];

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  if (meridiem) {
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
  } else if (timeFormat === "12h" && hour === 12) {
    hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

/**
 * Build a Date from separate date and time strings
 */
export function buildLocalDateTime(
  dateValue: string,
  timeValue: string,
  options: {
    timeZone: string;
    dateOrder: DateOrder;
    timeFormat: TimeFormat;
  },
): Date | null {
  const date = parseDatePart(dateValue, options.dateOrder);
  const time = parseTimePart(timeValue, options.timeFormat);
  if (!date || !time) return null;
  return new TZDate(
    date.year,
    date.month - 1,
    date.day,
    time.hour,
    time.minute,
    options.timeZone,
  );
}

/**
 * Parse a datetime value with optional timezone handling
 */
export function parseDateTimeValue(
  value: string,
  options: {
    timeZone: string;
    dateOrder: DateOrder;
    timeFormat: TimeFormat;
    assumeLocal: boolean;
  },
): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (hasExplicitOffset(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (!options.assumeLocal) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const separatorIndex = trimmed.includes("T")
    ? trimmed.indexOf("T")
    : trimmed.indexOf(" ");
  if (separatorIndex === -1) return null;

  const datePart = trimmed.slice(0, separatorIndex);
  const timePart = trimmed.slice(separatorIndex + 1);

  return buildLocalDateTime(datePart, timePart, {
    timeZone: options.timeZone,
    dateOrder: options.dateOrder,
    timeFormat: options.timeFormat,
  });
}

/**
 * Check if a Date is aligned to the hour (minute = 0, second = 0)
 */
export function isHourAligned(instant: Date, timeZone: string): boolean {
  const zoned = getZonedDate(instant, timeZone);
  return zoned.getMinutes() === 0 && zoned.getSeconds() === 0;
}

/**
 * Parse time from image OCR output (tries both 24h and 12h formats)
 */
export function parseImageTime(
  value: string,
): { hour: number; minute: number } | null {
  const parsed24 = parseTimePart(value, "24h");
  if (parsed24) return parsed24;
  const parsed12 = parseTimePart(value, "12h");
  if (parsed12) return parsed12;
  const match = value.match(/(\d{1,2}:\d{2})/);
  if (match) {
    return parseTimePart(match[1], "24h") ?? parseTimePart(match[1], "12h");
  }
  return null;
}
