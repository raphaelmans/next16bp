import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const RemovePlacePhotoSchema = z.object({
  placeId: S.ids.placeId,
  photoId: S.ids.photoId,
});

export type RemovePlacePhotoDTO = z.infer<typeof RemovePlacePhotoSchema>;
