import { z } from "zod";
import { S } from "@/common/schemas";

/**
 * Schema for updating payment proof.
 * All fields are optional for partial updates.
 */
export const UpdatePaymentProofSchema = z.object({
  reservationId: S.ids.reservationId,
  fileUrl: S.common.url().nullish(),
  referenceNumber: S.paymentProof.referenceNumber.nullish(),
  notes: S.paymentProof.notes.nullish(),
});

export type UpdatePaymentProofDTO = z.infer<typeof UpdatePaymentProofSchema>;
