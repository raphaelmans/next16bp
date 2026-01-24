import { z } from "zod";

export const ReservationListItemSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "CREATED",
    "AWAITING_PAYMENT",
    "PAYMENT_MARKED_BY_USER",
    "CONFIRMED",
    "EXPIRED",
    "CANCELLED",
  ]),
  playerNameSnapshot: z.string().nullable(),
  playerPhoneSnapshot: z.string().nullable(),
  createdAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  courtId: z.string().uuid(),
  courtName: z.string(),
  placeId: z.string().uuid(),
  placeName: z.string(),
  placeAddress: z.string(),
  placeCity: z.string(),
  coverImageUrl: z.string().nullable(),
  slotStartTime: z.string(),
  slotEndTime: z.string(),
  amountCents: z.number().nullable(),
  currency: z.string().nullable(),
});

export type ReservationListItemRecord = z.infer<
  typeof ReservationListItemSchema
>;
