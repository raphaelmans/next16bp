import { zfd } from "zod-form-data";
import { imageFileSchema } from "@/modules/storage/dtos";
import { S } from "@/shared/kernel/schemas";

export const UploadPlacePhotoSchema = zfd.formData({
  placeId: zfd.text(S.ids.placeId),
  image: imageFileSchema,
});

export type UploadPlacePhotoInput = {
  placeId: string;
  image: File;
};
