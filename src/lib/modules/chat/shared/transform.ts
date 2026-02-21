import { parseReservationThreadId } from "./domain";

export function toReservationIdsFromThreadIds(
  threadIds: readonly (string | null | undefined)[],
): string[] {
  const seen = new Set<string>();
  const reservationIds: string[] = [];

  for (const threadId of threadIds) {
    if (typeof threadId !== "string") {
      continue;
    }

    const parsed = parseReservationThreadId(threadId);
    if (!parsed) {
      continue;
    }

    if (seen.has(parsed.reservationId)) {
      continue;
    }

    seen.add(parsed.reservationId);
    reservationIds.push(parsed.reservationId);
  }

  return reservationIds;
}
