import { z } from "zod";

const DurationMinutesSchema = z
  .number()
  .int()
  .min(60)
  .max(1440)
  .refine((value) => value % 60 === 0, {
    message: "Duration must be a multiple of 60 minutes",
  });

export const GetAvailabilityForCourtSchema = z.object({
  courtId: z.string().uuid(),
  date: z.string().datetime(),
  durationMinutes: DurationMinutesSchema,
});

export const GetAvailabilityForPlaceSportSchema = z.object({
  placeId: z.string().uuid(),
  sportId: z.string().uuid(),
  date: z.string().datetime(),
  durationMinutes: DurationMinutesSchema,
});

export type GetAvailabilityForCourtDTO = z.infer<
  typeof GetAvailabilityForCourtSchema
>;
export type GetAvailabilityForPlaceSportDTO = z.infer<
  typeof GetAvailabilityForPlaceSportSchema
>;
