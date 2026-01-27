import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

/**
 * Schema for approving a claim request (admin only)
 */
export const ApproveClaimRequestSchema = z.object({
  requestId: S.ids.requestId,
  reviewNotes: S.claimRequest.reviewNotesOptional,
});

export type ApproveClaimRequestDTO = z.infer<typeof ApproveClaimRequestSchema>;
