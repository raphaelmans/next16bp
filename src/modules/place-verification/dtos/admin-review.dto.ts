import { z } from "zod";

export const ReviewPlaceVerificationSchema = z.object({
  requestId: z.string().uuid(),
  reviewNotes: z.string().min(1).max(1000),
});

export type ReviewPlaceVerificationDTO = z.infer<
  typeof ReviewPlaceVerificationSchema
>;

export const ApprovePlaceVerificationSchema = z.object({
  requestId: z.string().uuid(),
  reviewNotes: z.string().max(1000).optional(),
});

export type ApprovePlaceVerificationDTO = z.infer<
  typeof ApprovePlaceVerificationSchema
>;
