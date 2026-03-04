import { addDays } from "date-fns";
import {
  getZonedDayKey,
  getZonedDayRangeForInstant,
  getZonedDayRangeFromDayKey,
} from "@/common/time-zone";

type SameOrNextDayOptions = {
  selectedStartTimeIso: string;
  candidateDayKey: string;
  timeZone: string;
};

type WithinAdjacentWeekOptions = {
  selectedStartTimeIso: string;
  candidateDayKey: string;
  timeZone: string;
};

/**
 * Returns the next calendar day key (in place timezone) for a given instant.
 */
export function getNextDayKeyForInstant(
  instant: Date | string,
  timeZone: string,
): string {
  const dayStart = getZonedDayRangeForInstant(instant, timeZone).start;
  return getZonedDayKey(addDays(dayStart, 1), timeZone);
}

/**
 * True when candidateDayKey is either:
 * - the same day as selected start, or
 * - the immediately next day.
 */
export function isSameOrNextDay({
  selectedStartTimeIso,
  candidateDayKey,
  timeZone,
}: SameOrNextDayOptions): boolean {
  const startDayKey = getZonedDayKey(selectedStartTimeIso, timeZone);
  if (candidateDayKey === startDayKey) return true;
  return (
    candidateDayKey === getNextDayKeyForInstant(selectedStartTimeIso, timeZone)
  );
}

/**
 * True when candidate day is within +/- 7 calendar days of selected start day
 * (in place timezone). Used to preserve selection across adjacent week jumps.
 */
export function isWithinAdjacentWeek({
  selectedStartTimeIso,
  candidateDayKey,
  timeZone,
}: WithinAdjacentWeekOptions): boolean {
  const selectedDayStart = getZonedDayRangeForInstant(
    selectedStartTimeIso,
    timeZone,
  ).start;
  const candidateDayStart = getZonedDayRangeFromDayKey(
    candidateDayKey,
    timeZone,
  ).start;
  const diffMs = Math.abs(
    candidateDayStart.getTime() - selectedDayStart.getTime(),
  );
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return diffDays <= 7;
}
