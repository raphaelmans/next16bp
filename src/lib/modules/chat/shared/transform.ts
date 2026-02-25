import {
  parseReservationGroupThreadId,
  parseReservationThreadId,
} from "./domain";

export function toReservationThreadTargetsFromThreadIds(
  threadIds: readonly (string | null | undefined)[],
): {
  reservationIds: string[];
  reservationGroupIds: string[];
} {
  const reservationSeen = new Set<string>();
  const reservationGroupSeen = new Set<string>();
  const reservationIds: string[] = [];
  const reservationGroupIds: string[] = [];

  for (const threadId of threadIds) {
    if (typeof threadId !== "string") {
      continue;
    }

    const parsedReservation = parseReservationThreadId(threadId);
    if (parsedReservation) {
      if (!reservationSeen.has(parsedReservation.reservationId)) {
        reservationSeen.add(parsedReservation.reservationId);
        reservationIds.push(parsedReservation.reservationId);
      }
      continue;
    }

    const parsedReservationGroup = parseReservationGroupThreadId(threadId);
    if (parsedReservationGroup) {
      if (
        !reservationGroupSeen.has(parsedReservationGroup.reservationGroupId)
      ) {
        reservationGroupSeen.add(parsedReservationGroup.reservationGroupId);
        reservationGroupIds.push(parsedReservationGroup.reservationGroupId);
      }
    }
  }

  return { reservationIds, reservationGroupIds };
}

export function toReservationIdsFromThreadIds(
  threadIds: readonly (string | null | undefined)[],
): string[] {
  return toReservationThreadTargetsFromThreadIds(threadIds).reservationIds;
}
