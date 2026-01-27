import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

/**
 * Schema for getting reservation history
 */
export const GetReservationHistorySchema = z.object({
  reservationId: S.ids.reservationId,
});

export type GetReservationHistoryDTO = z.infer<
  typeof GetReservationHistorySchema
>;

/**
 * Schema for getting claim request history (admin only)
 */
export const GetClaimHistorySchema = z.object({
  claimRequestId: S.ids.requestId,
});

export type GetClaimHistoryDTO = z.infer<typeof GetClaimHistorySchema>;
