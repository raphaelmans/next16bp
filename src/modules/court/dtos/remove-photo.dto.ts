import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const RemoveCourtPhotoSchema = z.object({
  placeId: S.ids.placeId,
  photoId: S.ids.photoId,
});

export type RemoveCourtPhotoDTO = z.infer<typeof RemoveCourtPhotoSchema>;
