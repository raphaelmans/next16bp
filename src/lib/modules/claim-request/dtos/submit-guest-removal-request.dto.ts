import { z } from "zod";
import { S } from "@/common/schemas";

/**
 * Schema for submitting a guest removal request for a curated place
 */
export const SubmitGuestRemovalRequestSchema = z.object({
  placeId: S.ids.placeId,
  guestName: S.claimRequest.guestName,
  guestEmail: S.claimRequest.guestEmail,
  requestNotes: S.claimRequest.requestNotes,
});

export type SubmitGuestRemovalRequestDTO = z.infer<
  typeof SubmitGuestRemovalRequestSchema
>;
