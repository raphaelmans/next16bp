import { z } from "zod";
import { S, V } from "@/common/schemas";

const SelectedAddonSchema = z.object({
  addonId: S.ids.generic,
  quantity: z.number().int().min(1).default(1),
});

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

export const CreateReservationForCoachSchema = z.object({
  coachId: S.ids.coachId,
  startTime: S.common.isoDateTime,
  durationMinutes: S.availability.durationMinutes,
  selectedAddons: z.array(SelectedAddonSchema).max(20).optional(),
});

export type CreateReservationForCoachDTO = z.infer<
  typeof CreateReservationForCoachSchema
>;

export const AcceptCoachReservationSchema = z.object({
  reservationId: S.ids.reservationId,
});

export type AcceptCoachReservationDTO = z.infer<
  typeof AcceptCoachReservationSchema
>;

export const RejectCoachReservationSchema = z.object({
  reservationId: S.ids.reservationId,
  reason: S.reservation.rejectReason,
});

export type RejectCoachReservationDTO = z.infer<
  typeof RejectCoachReservationSchema
>;

export const ConfirmCoachPaymentSchema = z.object({
  reservationId: S.ids.reservationId,
  notes: S.reservation.notes,
});

export type ConfirmCoachPaymentDTO = z.infer<typeof ConfirmCoachPaymentSchema>;

export const CancelCoachReservationSchema = z.object({
  reservationId: S.ids.reservationId,
  reason: S.reservation.rejectReason,
});

export type CancelCoachReservationDTO = z.infer<
  typeof CancelCoachReservationSchema
>;

export const GetCoachReservationsSchema = z.object({
  status: ReservationStatusSchema.optional(),
  statuses: z.array(ReservationStatusSchema).min(1).optional(),
  timeBucket: z.enum(["past", "upcoming"]).optional(),
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type GetCoachReservationsDTO = z.infer<
  typeof GetCoachReservationsSchema
>;

export interface CoachReservationWithDetails {
  id: string;
  status: string;
  playerNameSnapshot: string | null;
  playerEmailSnapshot: string | null;
  playerPhoneSnapshot: string | null;
  cancellationReason: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  coachId: string;
  coachName: string;
  slotStartTime: string;
  slotEndTime: string;
  amountCents: number | null;
  currency: string | null;
  paymentProof: {
    referenceNumber: string | null;
    notes: string | null;
    fileUrl: string | null;
    createdAt: string;
  } | null;
}
