import { addMinutes, differenceInMinutes } from "date-fns";
import { getZonedDate } from "@/shared/lib/time-zone";
import { type CourtHoursWindow, getWindowsForDayOfWeek } from "./court-hours";
import {
  type CourtBlockItem,
  getMinuteOfDay,
  type ReservationItem,
} from "./types";

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && aEnd > bStart;

const isOpenHourSegment = (
  segmentStart: Date,
  timeZone: string,
  courtHoursWindows: CourtHoursWindow[],
) => {
  const startMinute = getMinuteOfDay(segmentStart, timeZone);
  if (startMinute + 60 > 24 * 60) return false;

  const dayOfWeek = getZonedDate(segmentStart, timeZone).getDay();
  const windows = getWindowsForDayOfWeek(courtHoursWindows, dayOfWeek);
  return windows.some(
    (w) => w.startMinute <= startMinute && w.endMinute >= startMinute + 60,
  );
};

export const computeClampedResizeRange = ({
  block,
  edge,
  hoursDelta,
  baseStart,
  baseEnd,
  timeZone,
  courtHoursWindows,
  blocks,
  reservations,
}: {
  block: Pick<CourtBlockItem, "id" | "courtId" | "type">;
  edge: "start" | "end";
  hoursDelta: number;
  baseStart: Date;
  baseEnd: Date;
  timeZone: string;
  courtHoursWindows: CourtHoursWindow[];
  blocks: Array<
    Pick<CourtBlockItem, "id" | "courtId" | "startTime" | "endTime">
  >;
  reservations: Array<Pick<ReservationItem, "startTime" | "endTime">>;
}): { startTime: Date; endTime: Date; appliedHoursDelta: number } | null => {
  if (hoursDelta === 0) return null;
  const sign = Math.sign(hoursDelta) as 1 | -1;
  const steps = Math.abs(hoursDelta);

  let start = baseStart;
  let end = baseEnd;
  let applied = 0;

  const otherBlocks = blocks.filter(
    (b) => b.courtId === block.courtId && b.id !== block.id,
  );

  for (let i = 0; i < steps; i += 1) {
    const nextStart = edge === "start" ? addMinutes(start, sign * 60) : start;
    const nextEnd = edge === "end" ? addMinutes(end, sign * 60) : end;

    if (differenceInMinutes(nextEnd, nextStart) < 60) break;

    // Expanding adds a new 60m segment; shrinking can never create overlaps.
    const isExpanding =
      (edge === "start" && sign < 0) || (edge === "end" && sign > 0);

    if (isExpanding) {
      if (block.type === "WALK_IN") {
        const addedSegmentStart = edge === "start" ? nextStart : end;
        if (
          !isOpenHourSegment(addedSegmentStart, timeZone, courtHoursWindows)
        ) {
          break;
        }
      }

      const hasBlockOverlap = otherBlocks.some((b) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return overlaps(nextStart, nextEnd, bStart, bEnd);
      });
      if (hasBlockOverlap) break;

      const hasReservationOverlap = reservations.some((r) => {
        const rStart = new Date(r.startTime);
        const rEnd = new Date(r.endTime);
        return overlaps(nextStart, nextEnd, rStart, rEnd);
      });
      if (hasReservationOverlap) break;
    }

    start = nextStart;
    end = nextEnd;
    applied += 1;
  }

  if (applied === 0) return null;
  return {
    startTime: start,
    endTime: end,
    appliedHoursDelta: sign * applied,
  };
};
