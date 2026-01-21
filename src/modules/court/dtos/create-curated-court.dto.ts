import { z } from "zod";

/**
 * Photo input for creating a place
 */
const PhotoInputSchema = z.object({
  url: z.string().url(),
  displayOrder: z.number().int().min(0).optional(),
});

/**
 * Court input for curated places
 */
const CourtInputSchema = z.object({
  label: z.string().min(1).max(100),
  sportId: z.string().uuid(),
  tierLabel: z.string().max(20).optional().nullable(),
});

/**
 * Coordinate schema that accepts string or number inputs.
 */
const CoordinateSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return value;
  },
  z
    .string()
    .refine((val) => !Number.isNaN(Number.parseFloat(val)), {
      message: "Coordinate must be a valid decimal number",
    })
    .optional(),
);

/**
 * Schema for creating a curated place (admin only)
 */
export const CreateCuratedCourtSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  country: z.string().length(2).optional(),
  latitude: CoordinateSchema,
  longitude: CoordinateSchema,
  timeZone: z.string().min(1).max(64).optional(),
  // Curated detail fields
  facebookUrl: z.string().url().optional(),
  phoneNumber: z.string().max(20).optional(),
  viberInfo: z.string().max(100).optional(),
  instagramUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  otherContactInfo: z.string().optional(),
  // Related data
  photos: z.array(PhotoInputSchema).optional(),
  amenities: z.array(z.string().min(1).max(100)).optional(),
  courts: z.array(CourtInputSchema).min(1),
});

export type CreateCuratedCourtDTO = z.infer<typeof CreateCuratedCourtSchema>;
