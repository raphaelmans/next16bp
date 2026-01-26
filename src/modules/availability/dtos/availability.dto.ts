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

export const GetAvailabilityForCourtSchema = z.object({
  courtId: z.string().uuid(),
  date: z
    .string()
    .datetime()
    .refine(
      (date) =>
        differenceInCalendarDays(new Date(date), new Date()) <=
        MAX_BOOKING_WINDOW_DAYS,
      {
        message: `Date must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
      },
    ),
  durationMinutes: DurationMinutesSchema,
  includeUnavailable: z.boolean().optional(),
});

export const GetAvailabilityForCourtsSchema = z.object({
  courtIds: z
    .array(z.string().uuid())
    .min(1, "At least one court is required")
    .max(50, "Too many courts requested"),
  date: z
    .string()
    .datetime()
    .refine(
      (date) =>
        differenceInCalendarDays(new Date(date), new Date()) <=
        MAX_BOOKING_WINDOW_DAYS,
      {
        message: `Date must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
      },
    ),
  durationMinutes: DurationMinutesSchema,
  includeUnavailable: z.boolean().optional(),
});

export const GetAvailabilityForPlaceSportSchema = z.object({
  placeId: z.string().uuid(),
  sportId: z.string().uuid(),
  date: z
    .string()
    .datetime()
    .refine(
      (date) =>
        differenceInCalendarDays(new Date(date), new Date()) <=
        MAX_BOOKING_WINDOW_DAYS,
      {
        message: `Date must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
      },
    ),
  durationMinutes: DurationMinutesSchema,
  includeUnavailable: z.boolean().optional(),
  includeCourtOptions: z.boolean().optional(),
});

const MAX_AVAILABILITY_RANGE_DAYS = MAX_BOOKING_WINDOW_DAYS;

const AvailabilityRangeSchema = z
  .object({
    startDate: z
      .string()
      .datetime()
      .refine(
        (date) =>
          differenceInCalendarDays(new Date(date), new Date()) <=
          MAX_BOOKING_WINDOW_DAYS,
        {
          message: `Date must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
        },
      ),
    endDate: z
      .string()
      .datetime()
      .refine(
        (date) =>
          differenceInCalendarDays(new Date(date), new Date()) <=
          MAX_BOOKING_WINDOW_DAYS,
        {
          message: `Date must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
        },
      ),
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
    includeUnavailable: z.boolean().optional(),
  });

export const GetAvailabilityForPlaceSportRangeSchema =
  AvailabilityRangeSchema.extend({
    placeId: z.string().uuid(),
    sportId: z.string().uuid(),
    durationMinutes: DurationMinutesSchema,
    includeUnavailable: z.boolean().optional(),
    includeCourtOptions: z.boolean().optional(),
  });

export type GetAvailabilityForCourtDTO = z.infer<
  typeof GetAvailabilityForCourtSchema
>;
export type GetAvailabilityForCourtsDTO = z.infer<
  typeof GetAvailabilityForCourtsSchema
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

export const AvailabilityDiagnosticsSchema = z.object({
  hasHoursWindows: z.boolean(),
  hasRateRules: z.boolean(),
  dayHasHours: z.boolean(),
  allSlotsBooked: z.boolean(),
});

export type AvailabilityDiagnosticsDTO = z.infer<
  typeof AvailabilityDiagnosticsSchema
>;
