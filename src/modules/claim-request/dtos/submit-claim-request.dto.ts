import { z } from "zod";

/**
 * Schema for submitting a claim request for a curated court
 */
export const SubmitClaimRequestSchema = z.object({
  courtId: z.string().uuid(),
  organizationId: z.string().uuid(),
  requestNotes: z.string().max(1000).optional(),
});

export type SubmitClaimRequestDTO = z.infer<typeof SubmitClaimRequestSchema>;
