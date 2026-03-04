import type { TimeSlot } from "./time-slot-picker";

/** Duration of each grid slot in minutes */
export const TIMELINE_SLOT_DURATION = 60;

/** Maximum selectable duration in minutes (24 hours) */
export const MAX_DURATION_MINUTES = 1440;

/** Maximum selectable slot count */
export const MAX_SLOT_COUNT = MAX_DURATION_MINUTES / TIMELINE_SLOT_DURATION;

/** Compare two ISO timestamp strings by parsed milliseconds */
export const isSameInstant = (a: string, b: string): boolean => {
  const aMs = Date.parse(a);
  const bMs = Date.parse(b);
  if (Number.isFinite(aMs) && Number.isFinite(bMs)) {
    return aMs === bMs;
  }
  return a === b;
};

/** Extract the hour (0-23) from a slot's startTime in the given time zone */
export const getHourFromSlot = (slot: TimeSlot, timeZone: string): number => {
  const d = new Date(slot.startTime);
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  }).formatToParts(d);
  const hourPart = parts.find((p) => p.type === "hour");
  return hourPart ? Number.parseInt(hourPart.value, 10) : 0;
};

/** Check if a slot is available for display purposes */
export function isSlotAvailable(slot: TimeSlot): boolean {
  return slot.status === "available";
}

/** Check if a slot is available AND its start time is in the future */
export function isSlotSelectable(slot: TimeSlot, nowMs: number): boolean {
  return isSlotAvailable(slot) && Date.parse(slot.startTime) >= nowMs;
}
