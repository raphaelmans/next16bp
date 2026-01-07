import { z } from "zod";

/**
 * Schema for submitting a removal request for a claimed court
 */
export const SubmitRemovalRequestSchema = z.object({
  courtId: z.string().uuid(),
  organizationId: z.string().uuid(),
  requestNotes: z.string().min(1).max(1000), // Required for removal requests
});

export type SubmitRemovalRequestDTO = z.infer<
  typeof SubmitRemovalRequestSchema
>;
