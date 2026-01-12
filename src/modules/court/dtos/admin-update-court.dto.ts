import { z } from "zod";

/**
 * Schema for admin updating any place
 */
export const AdminUpdateCourtSchema = z.object({
  placeId: z.string().uuid(),
  // Place fields
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).max(100).optional(),
  latitude: z
    .string()
    .refine((val) => !Number.isNaN(Number.parseFloat(val)), {
      message: "Latitude must be a valid decimal number",
    })
    .optional(),
  longitude: z
    .string()
    .refine((val) => !Number.isNaN(Number.parseFloat(val)), {
      message: "Longitude must be a valid decimal number",
    })
    .optional(),
  timeZone: z.string().min(1).max(64).optional(),
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
  city: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type AdminCourtFiltersDTO = z.infer<typeof AdminCourtFiltersSchema>;
