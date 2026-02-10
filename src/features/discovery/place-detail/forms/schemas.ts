import { z } from "zod";
import { S } from "@/common/schemas";

export const claimFormSchema = z.object({
  organizationId: S.ids.organizationId,
  requestNotes: S.claimRequest.requestNotesOptional,
});

export const removalFormSchema = z.object({
  guestName: S.claimRequest.guestName,
  guestEmail: S.claimRequest.guestEmail,
  requestNotes: S.claimRequest.requestNotes,
});

export type ClaimFormData = z.infer<typeof claimFormSchema>;
export type RemovalFormData = z.infer<typeof removalFormSchema>;
