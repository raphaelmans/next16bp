import { z } from "zod";
import { S } from "@/common/schemas";

/**
 * Schema for submitting a removal request for a claimed place
 */
export const SubmitRemovalRequestSchema = z.object({
  placeId: S.ids.placeId,
  organizationId: S.ids.organizationId,
  requestNotes: S.claimRequest.requestNotes,
});

export type SubmitRemovalRequestDTO = z.infer<
  typeof SubmitRemovalRequestSchema
>;
