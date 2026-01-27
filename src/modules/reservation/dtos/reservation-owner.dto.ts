import { z } from "zod";
import { S, V } from "@/shared/kernel/schemas";

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

export const AcceptReservationSchema = z.object({
  reservationId: S.ids.reservationId,
});

export type AcceptReservationDTO = z.infer<typeof AcceptReservationSchema>;

export const ConfirmPaymentSchema = z.object({
  reservationId: S.ids.reservationId,
  notes: S.reservation.notes,
});

export type ConfirmPaymentDTO = z.infer<typeof ConfirmPaymentSchema>;

export const RejectReservationSchema = z.object({
  reservationId: S.ids.reservationId,
  reason: S.reservation.rejectReason,
});

export type RejectReservationDTO = z.infer<typeof RejectReservationSchema>;

export const GetOrgReservationsSchema = z.object({
  organizationId: S.ids.organizationId,
  reservationId: S.ids.reservationId.optional(),
  placeId: S.ids.placeId.optional(),
  courtId: S.ids.courtId.optional(),
  status: ReservationStatusSchema.optional(),
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type GetOrgReservationsDTO = z.infer<typeof GetOrgReservationsSchema>;

export const GetPendingForCourtSchema = z.object({
  courtId: S.ids.courtId,
});

export type GetPendingForCourtDTO = z.infer<typeof GetPendingForCourtSchema>;

export const GetPendingCountSchema = z.object({
  organizationId: S.ids.organizationId,
});

export type GetPendingCountDTO = z.infer<typeof GetPendingCountSchema>;

export const ReservationWithDetailsSchema = z.object({
  id: S.ids.reservationId,
  status: ReservationStatusSchema,
  playerNameSnapshot: z.string().nullable(),
  playerEmailSnapshot: z.string().nullable(),
  playerPhoneSnapshot: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: z.string().nullable(),
  expiresAt: z.string().nullable(),

  // Enriched fields from joins
  courtId: S.ids.courtId,
  courtName: z.string(),
  slotStartTime: z.string(),
  slotEndTime: z.string(),
  amountCents: z.number().nullable(),
  currency: z.string().nullable(),
  paymentProof: z
    .object({
      referenceNumber: z.string().nullable(),
      notes: z.string().nullable(),
      fileUrl: z.string().nullable(),
      createdAt: z.string(),
    })
    .nullable(),
});

export type ReservationWithDetails = z.infer<
  typeof ReservationWithDetailsSchema
>;
