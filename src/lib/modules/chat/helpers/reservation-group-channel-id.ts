import { makeReservationGroupThreadId } from "../shared/domain";

export function makeReservationGroupChannelId(
  reservationGroupId: string,
): string {
  return makeReservationGroupThreadId(reservationGroupId);
}
