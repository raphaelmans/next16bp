import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const ReorderPlacePhotosSchema = z.object({
  placeId: S.ids.placeId,
  orderedIds: z
    .array(S.ids.photoId)
    .min(S.place.photos.min.value, { error: S.place.photos.min.message })
    .refine((value) => new Set(value).size === value.length, {
      error: "Photo order must be unique",
    }),
});

export type ReorderPlacePhotosDTO = z.infer<typeof ReorderPlacePhotosSchema>;
