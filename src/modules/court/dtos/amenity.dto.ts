import { z } from "zod";

/**
 * Schema for adding an amenity to a court
 */
export const AddAmenitySchema = z.object({
  courtId: z.string().uuid(),
  name: z.string().min(1).max(100),
});

export type AddAmenityDTO = z.infer<typeof AddAmenitySchema>;

/**
 * Schema for removing an amenity from a court
 */
export const RemoveAmenitySchema = z.object({
  courtId: z.string().uuid(),
  amenityId: z.string().uuid(),
});

export type RemoveAmenityDTO = z.infer<typeof RemoveAmenitySchema>;
