import { z } from "zod";

/**
 * Schema for rejecting a claim request (admin only)
 * Reason is required for rejection
 */
export const RejectClaimRequestSchema = z.object({
  requestId: z.string().uuid(),
  reviewNotes: z.string().min(1).max(1000),
});

export type RejectClaimRequestDTO = z.infer<typeof RejectClaimRequestSchema>;
