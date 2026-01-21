import { differenceInCalendarDays } from "date-fns";
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

const MAX_AVAILABILITY_RANGE_DAYS = 45;

const AvailabilityRangeSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine(
    (data) =>
      differenceInCalendarDays(
        new Date(data.endDate),
        new Date(data.startDate),
      ) <= MAX_AVAILABILITY_RANGE_DAYS,
    {
      message: `Date range must be within ${MAX_AVAILABILITY_RANGE_DAYS} days`,
      path: ["endDate"],
    },
  );

export const GetAvailabilityForCourtRangeSchema =
  AvailabilityRangeSchema.extend({
    courtId: z.string().uuid(),
    durationMinutes: DurationMinutesSchema,
  });

export const GetAvailabilityForPlaceSportRangeSchema =
  AvailabilityRangeSchema.extend({
    placeId: z.string().uuid(),
    sportId: z.string().uuid(),
    durationMinutes: DurationMinutesSchema,
  });

export type GetAvailabilityForCourtDTO = z.infer<
  typeof GetAvailabilityForCourtSchema
>;
export type GetAvailabilityForPlaceSportDTO = z.infer<
  typeof GetAvailabilityForPlaceSportSchema
>;
export type GetAvailabilityForCourtRangeDTO = z.infer<
  typeof GetAvailabilityForCourtRangeSchema
>;
export type GetAvailabilityForPlaceSportRangeDTO = z.infer<
  typeof GetAvailabilityForPlaceSportRangeSchema
>;
