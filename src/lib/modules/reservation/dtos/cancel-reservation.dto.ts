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

export const CancelReservationSchema = z.object({
  reservationId: S.ids.reservationId,
  reason: S.reservation.cancelReason,
});

export type CancelReservationDTO = z.infer<typeof CancelReservationSchema>;

export const GetMyReservationsSchema = z.object({
  status: ReservationStatusSchema.optional(),
  /** Filter for future reservations only (startTime > now) */
  upcoming: z.boolean().optional(),
  /** ISO datetime lower bound for startTime (inclusive) */
  dateFrom: z.string().datetime().optional(),
  /** ISO datetime upper bound for startTime (inclusive) */
  dateTo: z.string().datetime().optional(),
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type GetMyReservationsDTO = z.infer<typeof GetMyReservationsSchema>;
