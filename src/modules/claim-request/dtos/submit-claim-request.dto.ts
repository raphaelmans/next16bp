import { z } from "zod";

/**
 * Schema for submitting a claim request for a curated place
 */
export const SubmitClaimRequestSchema = z.object({
  placeId: z.string().uuid(),
  organizationId: z.string().uuid(),
  requestNotes: z.string().max(1000).optional(),
});

export type SubmitClaimRequestDTO = z.infer<typeof SubmitClaimRequestSchema>;
