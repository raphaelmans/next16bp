/**
 * ICS (iCalendar) parsing utilities for bookings import
 */

import IcalExpander from "ical-expander";

export interface IcsOccurrence {
  start: Date;
  end: Date;
  summary?: string;
  location?: string;
  description?: string;
  uid?: string;
  status?: string;
  isAllDay: boolean;
}

/**
 * Convert ical.js date objects to JavaScript Date
 */
function toJsDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (!value || typeof value !== "object") return null;
  if ("toJSDate" in value && typeof value.toJSDate === "function") {
    const result = value.toJSDate();
    return result instanceof Date ? result : null;
  }
  return null;
}

/**
 * Extract string property from event object
 */
function getEventString(item: unknown, key: string): string | undefined {
  if (!item || typeof item !== "object") return undefined;
  const record = item as Record<string, unknown>;
  const direct = record[key];
  if (typeof direct === "string") return direct;
  const lower = record[key.toLowerCase()];
  if (typeof lower === "string") return lower;
  const getter = record.getFirstPropertyValue;
  if (typeof getter === "function") {
    const value = getter.call(record, key);
    if (typeof value === "string") return value;
  }
  return undefined;
}

/**
 * Check if a date value represents an all-day event
 */
function isAllDayValue(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if ("isDate" in value && value.isDate === true) return true;
  return false;
}

/**
 * Parse ICS content and return occurrences within a date range
 */
export function parseIcs(
  content: string,
  rangeStart: Date,
  rangeEnd: Date,
): IcsOccurrence[] {
  const expander = new IcalExpander({ ics: content, maxIterations: 10000 });
  const { events, occurrences } = expander.between(rangeStart, rangeEnd);
  const results: IcsOccurrence[] = [];

  for (const entry of events) {
    const item = entry.item ?? entry;
    const startValue = entry.startDate ?? item?.startDate ?? item?.startTime;
    const endValue = entry.endDate ?? item?.endDate ?? item?.endTime;
    const start = toJsDate(startValue);
    const end = toJsDate(endValue);
    if (!start || !end) continue;

    results.push({
      start,
      end,
      summary: getEventString(item, "summary"),
      location: getEventString(item, "location"),
      description: getEventString(item, "description"),
      uid: getEventString(item, "uid"),
      status: getEventString(item, "status"),
      isAllDay: isAllDayValue(startValue) || isAllDayValue(endValue),
    });
  }

  for (const occurrence of occurrences) {
    const item = occurrence.item ?? occurrence;
    const startValue =
      occurrence.startDate ?? item?.startDate ?? item?.startTime;
    const endValue = occurrence.endDate ?? item?.endDate ?? item?.endTime;
    const start = toJsDate(startValue);
    const end = toJsDate(endValue);
    if (!start || !end) continue;

    results.push({
      start,
      end,
      summary: getEventString(item, "summary"),
      location: getEventString(item, "location"),
      description: getEventString(item, "description"),
      uid: getEventString(item, "uid"),
      status: getEventString(item, "status"),
      isAllDay: isAllDayValue(startValue) || isAllDayValue(endValue),
    });
  }

  return results;
}
