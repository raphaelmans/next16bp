import { z } from "zod";

export const ReorderPlacePhotosSchema = z.object({
  placeId: z.string().uuid(),
  orderedIds: z
    .array(z.string().uuid())
    .min(1)
    .refine((value) => new Set(value).size === value.length, {
      message: "Photo order must be unique",
    }),
});

export type ReorderPlacePhotosDTO = z.infer<typeof ReorderPlacePhotosSchema>;
