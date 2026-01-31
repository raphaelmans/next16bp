import { z } from "zod";
import { S } from "@/common/schemas";

export const ReviewPlaceVerificationSchema = z.object({
  requestId: S.ids.requestId,
  reviewNotes: S.claimRequest.reviewNotes,
});

export type ReviewPlaceVerificationDTO = z.infer<
  typeof ReviewPlaceVerificationSchema
>;

export const ApprovePlaceVerificationSchema = z.object({
  requestId: S.ids.requestId,
  reviewNotes: S.claimRequest.reviewNotesOptional,
});

export type ApprovePlaceVerificationDTO = z.infer<
  typeof ApprovePlaceVerificationSchema
>;
