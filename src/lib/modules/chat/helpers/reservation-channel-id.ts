import { makeReservationThreadId } from "../shared/domain";

export function makeReservationChannelId(reservationId: string): string {
  return makeReservationThreadId(reservationId);
}
