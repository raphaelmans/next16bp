import { z } from "zod";

const DurationMinutesSchema = z
  .number()
  .int()
  .min(60)
  .max(1440)
  .refine((value) => value % 60 === 0, {
    message: "Duration must be a multiple of 60 minutes",
  });

export const CreateReservationSchema = z.object({
  timeSlotId: z.string().uuid(),
});

export const CreateReservationForCourtSchema = z.object({
  courtId: z.string().uuid(),
  startTime: z.string().datetime(),
  durationMinutes: DurationMinutesSchema,
});

export const CreateReservationForAnyCourtSchema = z.object({
  placeId: z.string().uuid(),
  sportId: z.string().uuid(),
  startTime: z.string().datetime(),
  durationMinutes: DurationMinutesSchema,
});

export type CreateReservationDTO = z.infer<typeof CreateReservationSchema>;
export type CreateReservationForCourtDTO = z.infer<
  typeof CreateReservationForCourtSchema
>;
export type CreateReservationForAnyCourtDTO = z.infer<
  typeof CreateReservationForAnyCourtSchema
>;
