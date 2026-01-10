import { z } from "zod";
import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";

/**
 * Schema for court photo upload FormData.
 */
export const UploadCourtPhotoSchema = zfd.formData({
  courtId: zfd.text(z.string().uuid()),
  image: imageFileSchema,
});

export type UploadCourtPhotoInput = {
  courtId: string;
  image: File;
};
