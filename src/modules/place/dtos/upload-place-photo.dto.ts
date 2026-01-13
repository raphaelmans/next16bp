import { z } from "zod";
import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";

export const UploadPlacePhotoSchema = zfd.formData({
  placeId: zfd.text(z.string().uuid()),
  image: imageFileSchema,
});

export type UploadPlacePhotoInput = {
  placeId: string;
  image: File;
};
