import { z } from "zod";
import { S } from "@/common/schemas";

/**
 * Schema for adding payment proof to a reservation.
 * Either fileUrl or referenceNumber (or both) must be provided.
 */
export const AddPaymentProofSchema = z
  .object({
    reservationId: S.ids.reservationId,
    fileUrl: S.common.url().optional(),
    referenceNumber: S.paymentProof.referenceNumber,
    notes: S.paymentProof.notes,
  })
  .refine((data) => data.fileUrl || data.referenceNumber, {
    error: "Either fileUrl or referenceNumber is required",
    path: ["fileUrl"],
  });

export type AddPaymentProofDTO = z.infer<typeof AddPaymentProofSchema>;
