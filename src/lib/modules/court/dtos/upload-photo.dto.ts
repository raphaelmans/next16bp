import { zfd } from "zod-form-data";
import { S } from "@/common/schemas";
import { imageFileSchema } from "@/lib/modules/storage/dtos";

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
