import { z } from "zod";

/**
 * Schema for submitting a removal request for a claimed place
 */
export const SubmitRemovalRequestSchema = z.object({
  placeId: z.string().uuid(),
  organizationId: z.string().uuid(),
  requestNotes: z.string().min(10).max(1000), // Required for removal requests
});

export type SubmitRemovalRequestDTO = z.infer<
  typeof SubmitRemovalRequestSchema
>;
