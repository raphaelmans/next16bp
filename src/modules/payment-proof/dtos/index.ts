export * from "./add-payment-proof.dto";
export * from "./update-payment-proof.dto";
export * from "./upload-payment-proof.dto";

import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

/**
 * Schema for getting payment proof by reservation ID
 */
export const GetPaymentProofSchema = z.object({
  reservationId: S.ids.reservationId,
});

export type GetPaymentProofDTO = z.infer<typeof GetPaymentProofSchema>;
