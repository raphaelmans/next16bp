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

export const ReservationListItemSchema = z.object({
  id: S.ids.reservationId,
  status: ReservationStatusSchema,
  playerNameSnapshot: z.string().nullable(),
  playerPhoneSnapshot: z.string().nullable(),
  createdAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  courtId: S.ids.courtId,
  courtName: z.string(),
  placeId: S.ids.placeId,
  placeName: z.string(),
  placeAddress: z.string(),
  placeCity: z.string(),
  coverImageUrl: z.string().nullable(),
  slotStartTime: z.string(),
  slotEndTime: z.string(),
  amountCents: z.number().nullable(),
  currency: z.string().nullable(),
  openPlayId: S.ids.generic.nullable(),
});

export type ReservationListItemRecord = z.infer<
  typeof ReservationListItemSchema
>;
