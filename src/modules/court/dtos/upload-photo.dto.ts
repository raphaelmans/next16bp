import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";
import { S } from "@/shared/kernel/schemas";

/**
 * Schema for court photo upload FormData.
 */
export const UploadCourtPhotoSchema = zfd.formData({
  placeId: zfd.text(S.ids.placeId),
  image: imageFileSchema,
});

export type UploadCourtPhotoInput = {
  placeId: string;
  image: File;
};
