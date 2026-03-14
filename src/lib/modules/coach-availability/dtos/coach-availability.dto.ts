import { differenceInCalendarDays } from "date-fns";
import { z } from "zod";
import { S, V } from "@/common/schemas";

const SelectedAddonSchema = z.object({
  addonId: S.ids.generic,
  quantity: z.number().int().min(1).default(1),
});

const BOOKING_WINDOW_DAYS = V.availability.dateWithinWindow.value;

const BookingWindowDateSchema = S.common.isoDateTime.refine(
  (date) =>
    differenceInCalendarDays(new Date(date), new Date()) <= BOOKING_WINDOW_DAYS,
  {
    error: V.availability.dateWithinWindow.message,
  },
);

export const GetCoachAvailabilitySchema = z.object({
  coachId: S.ids.coachId,
  date: BookingWindowDateSchema,
  durationMinutes: S.availability.durationMinutes,
  includeUnavailable: z.boolean().optional(),
  selectedAddons: z.array(SelectedAddonSchema).max(20).optional(),
});

const MAX_AVAILABILITY_RANGE_DAYS = V.availability.rangeWithinWindow.value;

const CoachAvailabilityRangeSchema = z
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

export const GetCoachAvailabilityRangeSchema =
  CoachAvailabilityRangeSchema.extend({
    coachId: S.ids.coachId,
    durationMinutes: S.availability.durationMinutes,
    includeUnavailable: z.boolean().optional(),
    selectedAddons: z.array(SelectedAddonSchema).max(20).optional(),
  });

export const CoachAvailabilityDiagnosticsSchema = z.object({
  hasHoursWindows: z.boolean(),
  hasRateRules: z.boolean(),
  dayHasHours: z.boolean(),
  allSlotsBooked: z.boolean(),
});

export type GetCoachAvailabilityDTO = z.infer<
  typeof GetCoachAvailabilitySchema
>;
export type GetCoachAvailabilityRangeDTO = z.infer<
  typeof GetCoachAvailabilityRangeSchema
>;
export type CoachAvailabilityDiagnosticsDTO = z.infer<
  typeof CoachAvailabilityDiagnosticsSchema
>;
