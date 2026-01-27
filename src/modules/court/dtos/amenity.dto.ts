import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

/**
 * Schema for adding an amenity to a court
 */
export const AddAmenitySchema = z.object({
  courtId: S.ids.courtId,
  name: S.place.amenity,
});

export type AddAmenityDTO = z.infer<typeof AddAmenitySchema>;

/**
 * Schema for removing an amenity from a court
 */
export const RemoveAmenitySchema = z.object({
  courtId: S.ids.courtId,
  amenityId: S.ids.amenityId,
});

export type RemoveAmenityDTO = z.infer<typeof RemoveAmenitySchema>;
