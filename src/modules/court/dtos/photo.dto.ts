import { z } from "zod";

/**
 * Schema for adding a photo to a court
 */
export const AddPhotoSchema = z.object({
  courtId: z.string().uuid(),
  url: z.string().url(),
  displayOrder: z.number().int().min(0).optional(),
});

export type AddPhotoDTO = z.infer<typeof AddPhotoSchema>;

/**
 * Schema for removing a photo from a court
 */
export const RemovePhotoSchema = z.object({
  courtId: z.string().uuid(),
  photoId: z.string().uuid(),
});

export type RemovePhotoDTO = z.infer<typeof RemovePhotoSchema>;

/**
 * Schema for reordering photos
 */
export const ReorderPhotosSchema = z.object({
  courtId: z.string().uuid(),
  photoIds: z.array(z.string().uuid()).min(1),
});

export type ReorderPhotosDTO = z.infer<typeof ReorderPhotosSchema>;
