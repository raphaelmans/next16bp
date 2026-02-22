import { differenceInCalendarDays } from "date-fns";
import { z } from "zod";
import { S, V } from "@/common/schemas";

const SelectedAddonSchema = z.object({
  addonId: S.ids.generic,
  quantity: z.number().int().min(1).default(1),
});

const BOOKING_WINDOW_DAYS = V.reservation.startTimeWithinWindow.value;

const BookingWindowStartTimeSchema = S.common.isoDateTime.refine(
  (startTime) =>
    differenceInCalendarDays(new Date(startTime), new Date()) <=
    BOOKING_WINDOW_DAYS,
  {
    error: V.reservation.startTimeWithinWindow.message,
  },
);

const GroupReservationItemSchema = z.object({
  courtId: S.ids.courtId,
  startTime: BookingWindowStartTimeSchema,
  durationMinutes: S.availability.durationMinutes,
  selectedAddons: z.array(SelectedAddonSchema).max(20).optional(),
});

export const CreateReservationForCourtSchema = z.object({
  courtId: S.ids.courtId,
  startTime: BookingWindowStartTimeSchema,
  durationMinutes: S.availability.durationMinutes,
  selectedAddons: z.array(SelectedAddonSchema).max(20).optional(),
});

export const CreateReservationForAnyCourtSchema = z.object({
  placeId: S.ids.placeId,
  sportId: S.ids.sportId,
  startTime: BookingWindowStartTimeSchema,
  durationMinutes: S.availability.durationMinutes,
  selectedAddons: z.array(SelectedAddonSchema).max(20).optional(),
});

export const CreateReservationGroupSchema = z.object({
  placeId: S.ids.placeId,
  items: z.array(GroupReservationItemSchema).min(2).max(12),
});

export type CreateReservationForCourtDTO = z.infer<
  typeof CreateReservationForCourtSchema
>;
export type CreateReservationForAnyCourtDTO = z.infer<
  typeof CreateReservationForAnyCourtSchema
>;
export type CreateReservationGroupDTO = z.infer<
  typeof CreateReservationGroupSchema
>;
export type GroupReservationItemDTO = z.infer<
  typeof GroupReservationItemSchema
>;
