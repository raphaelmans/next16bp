import { z } from "zod";

export const ConfirmPaymentSchema = z.object({
  reservationId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export type ConfirmPaymentDTO = z.infer<typeof ConfirmPaymentSchema>;

export const RejectReservationSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export type RejectReservationDTO = z.infer<typeof RejectReservationSchema>;

export const GetOrgReservationsSchema = z.object({
  organizationId: z.string().uuid(),
  courtId: z.string().uuid().optional(),
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

export type GetOrgReservationsDTO = z.infer<typeof GetOrgReservationsSchema>;

export const GetPendingForCourtSchema = z.object({
  courtId: z.string().uuid(),
});

export type GetPendingForCourtDTO = z.infer<typeof GetPendingForCourtSchema>;

export const GetPendingCountSchema = z.object({
  organizationId: z.string().uuid(),
});

export type GetPendingCountDTO = z.infer<typeof GetPendingCountSchema>;
