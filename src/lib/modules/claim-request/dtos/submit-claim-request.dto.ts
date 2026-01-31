import { z } from "zod";
import { S } from "@/common/schemas";

/**
 * Schema for submitting a claim request for a curated place
 */
export const SubmitClaimRequestSchema = z.object({
  placeId: S.ids.placeId,
  organizationId: S.ids.organizationId,
  requestNotes: S.claimRequest.requestNotesOptional,
});

export type SubmitClaimRequestDTO = z.infer<typeof SubmitClaimRequestSchema>;
