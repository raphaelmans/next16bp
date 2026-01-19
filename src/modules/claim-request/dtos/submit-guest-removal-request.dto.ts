import { z } from "zod";

/**
 * Schema for submitting a guest removal request for a curated place
 */
export const SubmitGuestRemovalRequestSchema = z.object({
  placeId: z.string().uuid(),
  guestName: z.string().min(2).max(150),
  guestEmail: z.string().email().max(255),
  requestNotes: z.string().min(10).max(1000),
});

export type SubmitGuestRemovalRequestDTO = z.infer<
  typeof SubmitGuestRemovalRequestSchema
>;
