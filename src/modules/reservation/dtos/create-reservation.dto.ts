import { differenceInCalendarDays } from "date-fns";
import { z } from "zod";
import { MAX_BOOKING_WINDOW_DAYS } from "@/shared/lib/booking-window";

const DurationMinutesSchema = z
  .number()
  .int()
  .min(60)
  .max(1440)
  .refine((value) => value % 60 === 0, {
    message: "Duration must be a multiple of 60 minutes",
  });

export const CreateReservationForCourtSchema = z.object({
  courtId: z.string().uuid(),
  startTime: z
    .string()
    .datetime()
    .refine(
      (startTime) =>
        differenceInCalendarDays(new Date(startTime), new Date()) <=
        MAX_BOOKING_WINDOW_DAYS,
      {
        message: `Start time must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
      },
    ),
  durationMinutes: DurationMinutesSchema,
});

export const CreateReservationForAnyCourtSchema = z.object({
  placeId: z.string().uuid(),
  sportId: z.string().uuid(),
  startTime: z
    .string()
    .datetime()
    .refine(
      (startTime) =>
        differenceInCalendarDays(new Date(startTime), new Date()) <=
        MAX_BOOKING_WINDOW_DAYS,
      {
        message: `Start time must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
      },
    ),
  durationMinutes: DurationMinutesSchema,
});

export type CreateReservationForCourtDTO = z.infer<
  typeof CreateReservationForCourtSchema
>;
export type CreateReservationForAnyCourtDTO = z.infer<
  typeof CreateReservationForAnyCourtSchema
>;
