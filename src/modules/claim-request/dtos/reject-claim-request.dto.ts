import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

/**
 * Schema for rejecting a claim request (admin only)
 * Reason is required for rejection
 */
export const RejectClaimRequestSchema = z.object({
  requestId: S.ids.requestId,
  reviewNotes: S.claimRequest.reviewNotes,
});

export type RejectClaimRequestDTO = z.infer<typeof RejectClaimRequestSchema>;
