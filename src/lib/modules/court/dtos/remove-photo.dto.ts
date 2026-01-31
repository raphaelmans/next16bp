import { z } from "zod";
import { S } from "@/common/schemas";

export const RemoveCourtPhotoSchema = z.object({
  placeId: S.ids.placeId,
  photoId: S.ids.photoId,
});

export type RemoveCourtPhotoDTO = z.infer<typeof RemoveCourtPhotoSchema>;
