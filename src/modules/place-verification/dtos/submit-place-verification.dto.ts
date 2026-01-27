import { zfd } from "zod-form-data";
import { verificationDocumentFileSchema } from "@/modules/storage/dtos";
import { S } from "@/shared/kernel/schemas";

export const SubmitPlaceVerificationSchema = zfd.formData({
  placeId: zfd.text(S.ids.placeId),
  requestNotes: zfd.text(S.claimRequest.requestNotesOptional),
  documents: zfd
    .repeatableOfType(verificationDocumentFileSchema)
    .refine((files) => files.length > 0, {
      error: S.placeVerification.documentsMin.message,
    }),
});

export type SubmitPlaceVerificationDTO = {
  placeId: string;
  requestNotes?: string;
  documents: File[];
};
