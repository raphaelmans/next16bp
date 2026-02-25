import { buildMemoryKey } from "./time-slot-machine.actions";
import type { TimeSlotContext, TimeSlotEvent } from "./time-slot-machine.types";

type GuardArgs = {
  context: TimeSlotContext;
  event: TimeSlotEvent;
};

export function hasCourtMemory({ context, event }: GuardArgs): boolean {
  if (event.type !== "SELECT_COURT") return false;

  const key = buildMemoryKey(
    context.placeId,
    context.sportId,
    context.date,
    event.courtId,
  );
  return key !== null && key in context.courtMemory;
}

export function hasSnapshot({ context }: GuardArgs): boolean {
  return context.lastAddedSnapshot !== null;
}
