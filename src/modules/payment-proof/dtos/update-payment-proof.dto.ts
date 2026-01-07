import { z } from "zod";

/**
 * Schema for updating payment proof.
 * All fields are optional for partial updates.
 */
export const UpdatePaymentProofSchema = z.object({
  reservationId: z.string().uuid(),
  fileUrl: z.string().url().nullish(),
  referenceNumber: z.string().max(100).nullish(),
  notes: z.string().max(500).nullish(),
});

export type UpdatePaymentProofDTO = z.infer<typeof UpdatePaymentProofSchema>;
