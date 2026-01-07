import { z } from "zod";

export const CancelReservationSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type CancelReservationDTO = z.infer<typeof CancelReservationSchema>;

export const GetMyReservationsSchema = z.object({
  status: z
    .enum([
      "CREATED",
      "AWAITING_PAYMENT",
      "PAYMENT_MARKED_BY_USER",
      "CONFIRMED",
      "EXPIRED",
      "CANCELLED",
    ])
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type GetMyReservationsDTO = z.infer<typeof GetMyReservationsSchema>;
