import { addDays } from "date-fns";
import { getZonedDayKey, getZonedDayRangeForInstant } from "@/common/time-zone";

type SameOrNextDayOptions = {
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
