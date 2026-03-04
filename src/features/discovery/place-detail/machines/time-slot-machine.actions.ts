/**
 * Pure transformation functions for the timeSlotMachine.
 * These compute new context values — the machine file wraps them in assign().
 * Keeping them as pure functions makes them independently testable.
 */
import type {
  CourtMemoryValue,
  SelectionMode,
  TimeSlotContext,
  ViewMode,
} from "./time-slot-machine.types";

/** Build a court memory key from context values. */
export function buildMemoryKey(
  placeId: string,
  sportId: string | null,
  date: string | null,
  courtId: string,
): string | null {
  if (!sportId || !date) return null;
  return `${placeId}|${sportId}|${date}|${courtId}`;
}

/** Save current selection into memory for a given court, returning updated memory. */
export function saveToCourtMemory(
  memory: Record<string, CourtMemoryValue>,
  key: string | null,
  startTime: string | null,
  durationMinutes: number,
): Record<string, CourtMemoryValue> {
  if (!key || !startTime) return memory;
  return { ...memory, [key]: { startTime, durationMinutes } };
}

/** Remove a key from court memory, returning updated memory. */
export function removeFromCourtMemory(
  memory: Record<string, CourtMemoryValue>,
  key: string | null,
): Record<string, CourtMemoryValue> {
  if (!key || !(key in memory)) return memory;
  const next = { ...memory };
  delete next[key];
  return next;
}

/** Compute new context when selecting a sport. */
export function computeSportSelection(): Partial<TimeSlotContext> {
  return {
    courtId: null,
    startTime: null,
    mode: "court" as SelectionMode,
    viewMode: "week" as ViewMode,
    lastAddedSnapshot: null,
  };
}

/** Compute new context when switching to any mode. */
export function computeModeAny(): Partial<TimeSlotContext> {
  return {
    mode: "any" as SelectionMode,
    startTime: null,
    lastAddedSnapshot: null,
  };
}

/** Compute new context when switching to court mode. */
export function computeModeCourt(
  defaultDuration: number,
): Partial<TimeSlotContext> {
  return {
    mode: "court" as SelectionMode,
    startTime: null,
    viewMode: "week" as ViewMode,
    durationMinutes: defaultDuration,
    lastAddedSnapshot: null,
  };
}

/** Compute new context when selecting a court (handles memory save/restore). */
export function computeCourtSwitch(
  context: TimeSlotContext,
  nextCourtId: string,
): Partial<TimeSlotContext> {
  // Save current selection to memory for previous court
  const prevKey = context.courtId
    ? buildMemoryKey(
        context.placeId,
        context.sportId,
        context.date,
        context.courtId,
      )
    : null;
  let updatedMemory = saveToCourtMemory(
    context.courtMemory,
    prevKey,
    context.startTime,
    context.durationMinutes,
  );

  // Check memory for incoming court
  const nextKey = buildMemoryKey(
    context.placeId,
    context.sportId,
    context.date,
    nextCourtId,
  );
  const remembered = nextKey ? updatedMemory[nextKey] : undefined;

  // Don't save if already in memory and we're restoring from it
  if (prevKey && !context.startTime) {
    updatedMemory = context.courtMemory;
  }

  return {
    courtId: nextCourtId,
    courtMemory: context.startTime ? updatedMemory : context.courtMemory,
    startTime: remembered?.startTime ?? null,
    durationMinutes:
      remembered?.durationMinutes ?? context.defaultDurationMinutes,
    lastAddedSnapshot: null,
  };
}

/** Compute new context when selecting a date. */
export function computeDateSelection(
  preserveSelection?: boolean,
): Partial<TimeSlotContext> {
  if (preserveSelection) {
    return { lastAddedSnapshot: null };
  }
  return {
    startTime: null,
    lastAddedSnapshot: null,
  };
}

/** Compute new context when going to today. */
export function computeGoToToday(
  defaultDuration: number,
): Partial<TimeSlotContext> {
  return {
    startTime: null,
    durationMinutes: defaultDuration,
    lastAddedSnapshot: null,
  };
}

/** Compute new context when changing view mode. */
export function computeViewChange(): Partial<TimeSlotContext> {
  return {
    startTime: null,
    lastAddedSnapshot: null,
  };
}

/** Compute new context when committing a range selection. */
export function computeCommitRange(
  memory: Record<string, CourtMemoryValue>,
  startTime: string,
  durationMinutes: number,
  courtMemoryKey: string | null | undefined,
): Partial<TimeSlotContext> {
  const updatedMemory = courtMemoryKey
    ? saveToCourtMemory(memory, courtMemoryKey, startTime, durationMinutes)
    : memory;

  return {
    startTime,
    durationMinutes,
    courtMemory: updatedMemory,
  };
}

/** Compute new context when clearing selection. */
export function computeClearSelection(
  currentDuration: number,
  defaultDuration: number,
  resetDuration: boolean,
): Partial<TimeSlotContext> {
  return {
    startTime: null,
    durationMinutes: resetDuration ? defaultDuration : currentDuration,
  };
}

/** Compute new context when a cart item is added (clears selection + memory). */
export function computeCartItemAdded(
  memory: Record<string, CourtMemoryValue>,
  courtMemoryKey: string | null | undefined,
): Partial<TimeSlotContext> {
  return {
    startTime: null,
    courtMemory: removeFromCourtMemory(memory, courtMemoryKey ?? null),
  };
}

/** Save current selection as snapshot for restore-after-cart-add. */
export function computeSaveSnapshot(
  startTime: string | null,
  durationMinutes: number,
  existing: { startTime: string; durationMinutes: number } | null,
): { startTime: string; durationMinutes: number } | null {
  if (!startTime) return existing;
  return { startTime, durationMinutes };
}
