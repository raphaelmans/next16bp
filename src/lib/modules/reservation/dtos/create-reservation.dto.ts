import { differenceInCalendarDays } from "date-fns";
import { z } from "zod";
import { S, V } from "@/common/schemas";

const BOOKING_WINDOW_DAYS = V.reservation.startTimeWithinWindow.value;

const BookingWindowStartTimeSchema = S.common.isoDateTime.refine(
  (startTime) =>
    differenceInCalendarDays(new Date(startTime), new Date()) <=
    BOOKING_WINDOW_DAYS,
  {
    error: V.reservation.startTimeWithinWindow.message,
  },
);

export const CreateReservationForCourtSchema = z.object({
  courtId: S.ids.courtId,
  startTime: BookingWindowStartTimeSchema,
  durationMinutes: S.availability.durationMinutes,
  selectedAddonIds: z.array(S.ids.generic).max(20).optional(),
});

export const CreateReservationForAnyCourtSchema = z.object({
  placeId: S.ids.placeId,
  sportId: S.ids.sportId,
  startTime: BookingWindowStartTimeSchema,
  durationMinutes: S.availability.durationMinutes,
  selectedAddonIds: z.array(S.ids.generic).max(20).optional(),
});

export type CreateReservationForCourtDTO = z.infer<
  typeof CreateReservationForCourtSchema
>;
export type CreateReservationForAnyCourtDTO = z.infer<
  typeof CreateReservationForAnyCourtSchema
>;
