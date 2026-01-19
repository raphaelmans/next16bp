import { z } from "zod";

export const RemoveCourtPhotoSchema = z.object({
  placeId: z.string().uuid(),
  photoId: z.string().uuid(),
});

export type RemoveCourtPhotoDTO = z.infer<typeof RemoveCourtPhotoSchema>;
