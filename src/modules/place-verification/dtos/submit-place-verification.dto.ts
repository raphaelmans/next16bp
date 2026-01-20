import { z } from "zod";
import { zfd } from "zod-form-data";
import { verificationDocumentFileSchema } from "@/modules/storage/dtos";

export const SubmitPlaceVerificationSchema = zfd.formData({
  placeId: zfd.text(z.string().uuid()),
  requestNotes: zfd.text(z.string().max(1000).optional()),
  documents: zfd
    .repeatableOfType(verificationDocumentFileSchema)
    .refine((files) => files.length > 0, {
      message: "Please attach at least one document",
    }),
});

export type SubmitPlaceVerificationDTO = {
  placeId: string;
  requestNotes?: string;
  documents: File[];
};
