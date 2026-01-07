import { z } from "zod";

/**
 * Schema for approving a claim request (admin only)
 */
export const ApproveClaimRequestSchema = z.object({
  requestId: z.string().uuid(),
  reviewNotes: z.string().max(1000).optional(),
});

export type ApproveClaimRequestDTO = z.infer<typeof ApproveClaimRequestSchema>;
