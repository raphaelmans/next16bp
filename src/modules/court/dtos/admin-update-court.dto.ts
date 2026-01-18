import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .url("Invalid URL")
  .optional()
  .or(z.literal(""));

const optionalTextSchema = (maxLength: number) =>
  z.string().max(maxLength).optional().or(z.literal(""));

const coordinateSchema = z.preprocess(
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

const optionalPhotoInputSchema = z.object({
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  displayOrder: z.number().int().min(0).optional(),
});

const courtInputSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(100),
  sportId: z.string().uuid(),
  tierLabel: z.string().max(20).optional().nullable(),
});

/**
 * Schema for admin fetching a place
 */
export const AdminCourtDetailSchema = z.object({
  placeId: z.string().uuid(),
});

export type AdminCourtDetailDTO = z.infer<typeof AdminCourtDetailSchema>;

/**
 * Schema for admin updating any place
 */
export const AdminUpdateCourtSchema = z.object({
  placeId: z.string().uuid(),
  // Place fields
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).max(100).optional(),
  province: z.string().min(1).max(100).optional(),
  country: z.string().length(2).optional(),
  latitude: coordinateSchema,
  longitude: coordinateSchema,
  timeZone: z.string().min(1).max(64).optional(),
  // Contact details
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  viberInfo: optionalTextSchema(100),
  websiteUrl: optionalUrlSchema,
  otherContactInfo: optionalTextSchema(500),
  // Related data
  photos: z.array(optionalPhotoInputSchema).optional(),
  amenities: z.array(z.string().min(1).max(100)).optional(),
  courts: z.array(courtInputSchema).min(1).optional(),
});

export type AdminUpdateCourtDTO = z.infer<typeof AdminUpdateCourtSchema>;

/**
 * Schema for deactivating a place
 */
export const DeactivateCourtSchema = z.object({
  placeId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export type DeactivateCourtDTO = z.infer<typeof DeactivateCourtSchema>;

/**
 * Schema for activating a place
 */
export const ActivateCourtSchema = z.object({
  placeId: z.string().uuid(),
});

export type ActivateCourtDTO = z.infer<typeof ActivateCourtSchema>;

/**
 * Place type filter enum values
 */
const PlaceTypeFilterEnum = z.enum(["CURATED", "RESERVABLE"]);

/**
 * Claim status filter enum values
 */
const ClaimStatusFilterEnum = z.enum([
  "UNCLAIMED",
  "CLAIM_PENDING",
  "CLAIMED",
  "REMOVAL_REQUESTED",
]);

/**
 * Schema for admin place list filters
 */
export const AdminCourtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  placeType: PlaceTypeFilterEnum.optional(),
  claimStatus: ClaimStatusFilterEnum.optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type AdminCourtFiltersDTO = z.infer<typeof AdminCourtFiltersSchema>;
