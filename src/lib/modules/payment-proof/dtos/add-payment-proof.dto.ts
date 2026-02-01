import { z } from "zod";
import { S } from "@/common/schemas";

/**
 * Schema for adding payment proof to a reservation.
 * Either fileUrl or referenceNumber (or both) must be provided.
 */
export const AddPaymentProofSchema = z
  .object({
    reservationId: S.ids.reservationId,
    referenceNumber: S.paymentProof.referenceNumber,
    notes: S.paymentProof.notes,
  })
  .refine((data) => Boolean(data.referenceNumber), {
    error: "Reference number is required",
    path: ["referenceNumber"],
  });

export type AddPaymentProofDTO = z.infer<typeof AddPaymentProofSchema>;
