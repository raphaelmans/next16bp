import { z } from "zod";

/**
 * Schema for adding payment proof to a reservation.
 * Either fileUrl or referenceNumber (or both) must be provided.
 */
export const AddPaymentProofSchema = z
  .object({
    reservationId: z.string().uuid(),
    fileUrl: z.string().url().optional(),
    referenceNumber: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.fileUrl || data.referenceNumber, {
    message: "Either fileUrl or referenceNumber is required",
    path: ["fileUrl"],
  });

export type AddPaymentProofDTO = z.infer<typeof AddPaymentProofSchema>;
