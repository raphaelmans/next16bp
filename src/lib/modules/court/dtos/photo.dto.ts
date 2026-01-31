import { z } from "zod";
import { S } from "@/common/schemas";

/**
 * Schema for adding a photo to a court
 */
export const AddPhotoSchema = z.object({
  courtId: S.ids.courtId,
  url: S.common.url(),
  displayOrder: S.common.displayOrder.optional(),
});

export type AddPhotoDTO = z.infer<typeof AddPhotoSchema>;

/**
 * Schema for removing a photo from a court
 */
export const RemovePhotoSchema = z.object({
  courtId: S.ids.courtId,
  photoId: S.ids.photoId,
});

export type RemovePhotoDTO = z.infer<typeof RemovePhotoSchema>;

/**
 * Schema for reordering photos
 */
export const ReorderPhotosSchema = z.object({
  courtId: S.ids.courtId,
  photoIds: z
    .array(S.ids.photoId)
    .min(S.common.itemsMin.value, { error: S.common.itemsMin.message }),
});

export type ReorderPhotosDTO = z.infer<typeof ReorderPhotosSchema>;
