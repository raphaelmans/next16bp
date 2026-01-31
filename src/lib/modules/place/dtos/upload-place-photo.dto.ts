import { zfd } from "zod-form-data";
import { S } from "@/common/schemas";
import { imageFileSchema } from "@/lib/modules/storage/dtos";

export const UploadPlacePhotoSchema = zfd.formData({
  placeId: zfd.text(S.ids.placeId),
  image: imageFileSchema,
});

export type UploadPlacePhotoInput = {
  placeId: string;
  image: File;
};
