import { z } from "zod";
import { zfd } from "zod-form-data";
import { paymentProofFileSchema } from "@/modules/storage/dtos";

/**
 * Schema for payment proof upload FormData.
 * Accepts larger files (10MB) than regular images.
 */
export const UploadPaymentProofSchema = zfd.formData({
  reservationId: zfd.text(z.string().uuid()),
  image: paymentProofFileSchema,
  referenceNumber: zfd.text(z.string().optional()),
  notes: zfd.text(z.string().optional()),
});

export type UploadPaymentProofInput = {
  reservationId: string;
  image: File;
  referenceNumber?: string;
  notes?: string;
};
