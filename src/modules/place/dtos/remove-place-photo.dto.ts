import { z } from "zod";

export const RemovePlacePhotoSchema = z.object({
  placeId: z.string().uuid(),
  photoId: z.string().uuid(),
});

export type RemovePlacePhotoDTO = z.infer<typeof RemovePlacePhotoSchema>;
