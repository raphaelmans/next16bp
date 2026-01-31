import { z } from "zod";
import { S } from "@/common/schemas";

export const RemovePlacePhotoSchema = z.object({
  placeId: S.ids.placeId,
  photoId: S.ids.photoId,
});

export type RemovePlacePhotoDTO = z.infer<typeof RemovePlacePhotoSchema>;
