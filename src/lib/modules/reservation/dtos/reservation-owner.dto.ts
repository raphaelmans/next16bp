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

export const AcceptReservationSchema = z.object({
  reservationId: S.ids.reservationId,
});

export type AcceptReservationDTO = z.infer<typeof AcceptReservationSchema>;

export const AcceptReservationGroupSchema = z.object({
  reservationGroupId: S.ids.generic,
});

export type AcceptReservationGroupDTO = z.infer<
  typeof AcceptReservationGroupSchema
>;

export const ConfirmPaidOfflineSchema = z.object({
  reservationId: S.ids.reservationId,
  paymentMethodId: S.ids.paymentMethodId,
  paymentReference: S.reservation.referenceNumber,
});

export type ConfirmPaidOfflineDTO = z.infer<typeof ConfirmPaidOfflineSchema>;

export const ConfirmPaymentSchema = z.object({
  reservationId: S.ids.reservationId,
  notes: S.reservation.notes,
});

export type ConfirmPaymentDTO = z.infer<typeof ConfirmPaymentSchema>;

export const ConfirmPaymentGroupSchema = z.object({
  reservationGroupId: S.ids.generic,
  notes: S.reservation.notes,
});

export type ConfirmPaymentGroupDTO = z.infer<typeof ConfirmPaymentGroupSchema>;

export const RejectReservationSchema = z.object({
  reservationId: S.ids.reservationId,
  reason: S.reservation.rejectReason,
});

export type RejectReservationDTO = z.infer<typeof RejectReservationSchema>;

export const RejectReservationGroupSchema = z.object({
  reservationGroupId: S.ids.generic,
  reason: S.reservation.rejectReason,
});

export type RejectReservationGroupDTO = z.infer<
  typeof RejectReservationGroupSchema
>;

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

export const GetReservationGroupDetailSchema = z.object({
  reservationGroupId: S.ids.generic,
});

export type GetReservationGroupDetailDTO = z.infer<
  typeof GetReservationGroupDetailSchema
>;

export const GetPendingForCourtSchema = z.object({
  courtId: S.ids.courtId,
});

export type GetPendingForCourtDTO = z.infer<typeof GetPendingForCourtSchema>;

export const GetPendingCountSchema = z.object({
  organizationId: S.ids.organizationId,
});

export type GetPendingCountDTO = z.infer<typeof GetPendingCountSchema>;

export const GetActiveForCourtRangeSchema = z.object({
  courtId: S.ids.courtId,
  startTime: S.common.isoDateTime,
  endTime: S.common.isoDateTime,
});

export type GetActiveForCourtRangeDTO = z.infer<
  typeof GetActiveForCourtRangeSchema
>;

export const CreateGuestBookingSchema = z.object({
  courtId: S.ids.courtId,
  startTime: S.common.isoDateTime,
  endTime: S.common.isoDateTime,
  guestProfileId: S.ids.generic,
  notes: S.reservation.notes,
});

export type CreateGuestBookingDTO = z.infer<typeof CreateGuestBookingSchema>;

export const ConvertWalkInBlockSchema = z
  .object({
    blockId: S.ids.blockId,
    guestMode: z.enum(["existing", "new"]),
    guestProfileId: S.ids.generic.optional(),
    newGuestName: z.string().min(1).max(100).optional(),
    newGuestPhone: z.string().max(20).optional(),
    newGuestEmail: z.string().email().optional(),
    notes: S.reservation.notes,
  })
  .refine(
    (data) => {
      if (data.guestMode === "existing") return !!data.guestProfileId;
      return !!data.newGuestName;
    },
    {
      message:
        "Guest profile ID is required for existing mode; name is required for new mode",
    },
  );

export type ConvertWalkInBlockDTO = z.infer<typeof ConvertWalkInBlockSchema>;

export const ReservationWithDetailsSchema = z.object({
  id: S.ids.reservationId,
  status: ReservationStatusSchema,
  playerNameSnapshot: z.string().nullable(),
  playerEmailSnapshot: z.string().nullable(),
  playerPhoneSnapshot: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  reservationGroupId: z.string().nullable().optional(),

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
      filePath: z.string().nullable().optional(),
      createdAt: z.string(),
    })
    .nullable(),
});

export type ReservationWithDetails = z.infer<
  typeof ReservationWithDetailsSchema
>;
