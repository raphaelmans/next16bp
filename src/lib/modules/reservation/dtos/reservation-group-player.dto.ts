import { z } from "zod";
import { S, V } from "@/common/schemas";

const ReservationStatusSchema = z.enum(
  [
    "CREATED",
    "AWAITING_PAYMENT",
    "PAYMENT_MARKED_BY_USER",
    "CONFIRMED",
    "EXPIRED",
    "CANCELLED",
  ],
  { error: V.reservation.status.invalid.message },
);

export const GetPlayerReservationLinkedDetailSchema = z.object({
  reservationId: S.ids.reservationId,
});

export type GetPlayerReservationLinkedDetailDTO = z.infer<
  typeof GetPlayerReservationLinkedDetailSchema
>;

export const MarkPaymentLinkedSchema = z.object({
  reservationId: S.ids.reservationId,
  termsAccepted: z.literal(true, {
    error: V.reservation.termsAccepted.message,
  }),
});

export type MarkPaymentLinkedDTO = z.infer<typeof MarkPaymentLinkedSchema>;

export const ReservationGroupStatusSummarySchema = z.object({
  totalItems: z.number().int().min(0),
  payableItems: z.number().int().min(0),
  countsByStatus: z.record(ReservationStatusSchema, z.number().int().min(0)),
});

export const ReservationGroupDetailItemSchema = z.object({
  reservationId: S.ids.reservationId,
  status: ReservationStatusSchema,
  startTimeIso: z.string(),
  endTimeIso: z.string(),
  totalPriceCents: z.number().int().min(0),
  currency: z.string(),
  expiresAtIso: z.string().nullable(),
  court: z.object({
    id: S.ids.courtId,
    label: z.string(),
  }),
  place: z.object({
    id: S.ids.placeId,
    slug: z.string().nullable(),
    name: z.string(),
    address: z.string(),
    city: z.string(),
    timeZone: z.string(),
  }),
});

export type ReservationGroupDetailItemDTO = z.infer<
  typeof ReservationGroupDetailItemSchema
>;
