import { zfd } from "zod-form-data";
import { S } from "@/common/schemas";
import { verificationDocumentFileSchema } from "@/lib/modules/storage/dtos";

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
