import { zfd } from "zod-form-data";
import { S } from "@/common/schemas";
import { paymentProofFileSchema } from "@/lib/modules/storage/dtos";

/**
 * Schema for payment proof upload FormData.
 * Accepts larger files (10MB) than regular images.
 */
export const UploadPaymentProofSchema = zfd.formData({
  reservationId: zfd.text(S.ids.reservationId),
  image: paymentProofFileSchema,
  referenceNumber: zfd.text(S.paymentProof.referenceNumber),
  notes: zfd.text(S.paymentProof.notes),
});

export type UploadPaymentProofInput = {
  reservationId: string;
  image: File;
  referenceNumber?: string;
  notes?: string;
};
