import { z } from "zod";

/**
 * Schema for admin updating any court
 */
export const AdminUpdateCourtSchema = z.object({
  courtId: z.string().uuid(),
  // Court fields
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).max(100).optional(),
  latitude: z
    .string()
    .refine((val) => !Number.isNaN(parseFloat(val)), {
      message: "Latitude must be a valid decimal number",
    })
    .optional(),
  longitude: z
    .string()
    .refine((val) => !Number.isNaN(parseFloat(val)), {
      message: "Longitude must be a valid decimal number",
    })
    .optional(),
});

export type AdminUpdateCourtDTO = z.infer<typeof AdminUpdateCourtSchema>;

/**
 * Schema for deactivating a court
 */
export const DeactivateCourtSchema = z.object({
  courtId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export type DeactivateCourtDTO = z.infer<typeof DeactivateCourtSchema>;

/**
 * Schema for activating a court
 */
export const ActivateCourtSchema = z.object({
  courtId: z.string().uuid(),
});

export type ActivateCourtDTO = z.infer<typeof ActivateCourtSchema>;

/**
 * Court type filter enum values
 */
const CourtTypeFilterEnum = z.enum(["CURATED", "RESERVABLE"]);

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
 * Schema for admin court list filters
 */
export const AdminCourtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  courtType: CourtTypeFilterEnum.optional(),
  claimStatus: ClaimStatusFilterEnum.optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type AdminCourtFiltersDTO = z.infer<typeof AdminCourtFiltersSchema>;
