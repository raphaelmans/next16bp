import { z } from "zod";

/**
 * Schema for getting reservation history
 */
export const GetReservationHistorySchema = z.object({
  reservationId: z.string().uuid(),
});

export type GetReservationHistoryDTO = z.infer<
  typeof GetReservationHistorySchema
>;

/**
 * Schema for getting claim request history (admin only)
 */
export const GetClaimHistorySchema = z.object({
  claimRequestId: z.string().uuid(),
});

export type GetClaimHistoryDTO = z.infer<typeof GetClaimHistorySchema>;
