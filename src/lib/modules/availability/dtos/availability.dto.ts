import { differenceInCalendarDays } from "date-fns";
import { z } from "zod";
import { S, V } from "@/common/schemas";

const BOOKING_WINDOW_DAYS = V.availability.dateWithinWindow.value;

const BookingWindowDateSchema = S.common.isoDateTime.refine(
  (date) =>
    differenceInCalendarDays(new Date(date), new Date()) <= BOOKING_WINDOW_DAYS,
  {
    error: V.availability.dateWithinWindow.message,
  },
);

export const GetAvailabilityForCourtSchema = z.object({
  courtId: S.ids.courtId,
  date: BookingWindowDateSchema,
  durationMinutes: S.availability.durationMinutes,
  includeUnavailable: z.boolean().optional(),
  selectedAddonIds: z.array(S.ids.generic).max(20).optional(),
});

export const GetAvailabilityForCourtsSchema = z.object({
  courtIds: z
    .array(S.ids.courtId)
    .min(V.availability.courtIds.min.value, {
      error: V.availability.courtIds.min.message,
    })
    .max(V.availability.courtIds.max.value, {
      error: V.availability.courtIds.max.message,
    }),
  date: BookingWindowDateSchema,
  durationMinutes: S.availability.durationMinutes,
  includeUnavailable: z.boolean().optional(),
  selectedAddonIds: z.array(S.ids.generic).max(20).optional(),
});

export const GetAvailabilityForPlaceSportSchema = z.object({
  placeId: S.ids.placeId,
  sportId: S.ids.sportId,
  date: BookingWindowDateSchema,
  durationMinutes: S.availability.durationMinutes,
  includeUnavailable: z.boolean().optional(),
  includeCourtOptions: z.boolean().optional(),
  selectedAddonIds: z.array(S.ids.generic).max(20).optional(),
});

const MAX_AVAILABILITY_RANGE_DAYS = V.availability.rangeWithinWindow.value;

const AvailabilityRangeSchema = z
  .object({
    startDate: BookingWindowDateSchema,
    endDate: BookingWindowDateSchema,
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    error: V.availability.rangeEndAfterStart.message,
    path: ["endDate"],
  })
  .refine(
    (data) =>
      differenceInCalendarDays(
        new Date(data.endDate),
        new Date(data.startDate),
      ) <= MAX_AVAILABILITY_RANGE_DAYS,
    {
      error: V.availability.rangeWithinWindow.message,
      path: ["endDate"],
    },
  );

export const GetAvailabilityForCourtRangeSchema =
  AvailabilityRangeSchema.extend({
    courtId: S.ids.courtId,
    durationMinutes: S.availability.durationMinutes,
    includeUnavailable: z.boolean().optional(),
    selectedAddonIds: z.array(S.ids.generic).max(20).optional(),
  });

export const GetAvailabilityForPlaceSportRangeSchema =
  AvailabilityRangeSchema.extend({
    placeId: S.ids.placeId,
    sportId: S.ids.sportId,
    durationMinutes: S.availability.durationMinutes,
    includeUnavailable: z.boolean().optional(),
    includeCourtOptions: z.boolean().optional(),
    selectedAddonIds: z.array(S.ids.generic).max(20).optional(),
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
  reservationsDisabled: z.boolean().optional(),
});

export type AvailabilityDiagnosticsDTO = z.infer<
  typeof AvailabilityDiagnosticsSchema
>;
