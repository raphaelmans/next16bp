import { z } from "zod";
import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";

/**
 * Schema for court photo upload FormData.
 */
export const UploadCourtPhotoSchema = zfd.formData({
  placeId: zfd.text(z.string().uuid()),
  image: imageFileSchema,
});

export type UploadCourtPhotoInput = {
  placeId: string;
  image: File;
};
