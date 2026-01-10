export * from "./add-payment-proof.dto";
export * from "./update-payment-proof.dto";
export * from "./upload-payment-proof.dto";

import { z } from "zod";

/**
 * Schema for getting payment proof by reservation ID
 */
export const GetPaymentProofSchema = z.object({
  reservationId: z.string().uuid(),
});

export type GetPaymentProofDTO = z.infer<typeof GetPaymentProofSchema>;
