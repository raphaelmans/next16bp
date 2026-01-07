import { z } from "zod";

/**
 * Photo input for creating a court
 */
const PhotoInputSchema = z.object({
  url: z.string().url(),
  displayOrder: z.number().int().min(0).optional(),
});

/**
 * Schema for creating a curated court (admin only)
 */
export const CreateCuratedCourtSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  latitude: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Latitude must be a valid decimal number",
  }),
  longitude: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Longitude must be a valid decimal number",
  }),
  // Curated detail fields
  facebookUrl: z.string().url().optional(),
  viberInfo: z.string().max(100).optional(),
  instagramUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  otherContactInfo: z.string().optional(),
  // Related data
  photos: z.array(PhotoInputSchema).optional(),
  amenities: z.array(z.string().min(1).max(100)).optional(),
});

export type CreateCuratedCourtDTO = z.infer<typeof CreateCuratedCourtSchema>;
