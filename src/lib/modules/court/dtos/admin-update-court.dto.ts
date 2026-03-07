import { z } from "zod";
import { allowEmptyString, S, V } from "@/common/schemas";

const optionalUrlSchema = allowEmptyString(S.common.url().optional());

const optionalTextSchema = (maxLength: { value: number; message: string }) =>
  allowEmptyString(
    z.string().max(maxLength.value, { error: maxLength.message }).optional(),
  );

const coordinateSchema = S.common.coordinateInput;

const optionalPhotoInputSchema = z.object({
  url: optionalUrlSchema,
  displayOrder: S.common.displayOrder.optional(),
});

const courtInputSchema = z.object({
  id: S.ids.courtId.optional(),
  label: S.court.label,
  sportId: S.ids.sportId,
  tierLabel: S.court.tierLabel.nullish(),
});

/**
 * Schema for admin fetching a place
 */
export const AdminCourtDetailSchema = z.object({
  placeId: S.ids.placeId,
});

export type AdminCourtDetailDTO = z.infer<typeof AdminCourtDetailSchema>;

/**
 * Schema for admin updating any place
 */
export const AdminUpdateCourtSchema = z.object({
  placeId: S.ids.placeId,
  // Place fields
  name: S.place.name.optional(),
  address: S.place.address.optional(),
  city: S.place.city.optional(),
  province: S.place.province.optional(),
  latitude: coordinateSchema.latitude,
  longitude: coordinateSchema.longitude,
  extGPlaceId: S.place.googlePlaceId,
  featuredRank: S.common.displayOrder.optional(),
  provinceRank: S.common.displayOrder.optional(),
  // Contact details
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  phoneNumber: optionalTextSchema(V.place.phoneNumber.max),
  viberInfo: optionalTextSchema(V.place.viberInfo.max),
  websiteUrl: optionalUrlSchema,
  otherContactInfo: optionalTextSchema(V.place.otherContactInfo.max),
  // Related data
  photos: z.array(optionalPhotoInputSchema).optional(),
  amenities: z.array(S.place.amenity).optional(),
  courts: z
    .array(courtInputSchema)
    .min(S.court.listMin.value, { error: S.court.listMin.message })
    .optional(),
});

export type AdminUpdateCourtDTO = z.infer<typeof AdminUpdateCourtSchema>;

/**
 * Schema for deactivating a place
 */
export const DeactivateCourtSchema = z.object({
  placeId: S.ids.placeId,
  reason: S.claimRequest.reason,
});

export type DeactivateCourtDTO = z.infer<typeof DeactivateCourtSchema>;

/**
 * Schema for activating a place
 */
export const ActivateCourtSchema = z.object({
  placeId: S.ids.placeId,
});

export type ActivateCourtDTO = z.infer<typeof ActivateCourtSchema>;

/**
 * Place type filter enum values
 */
const PlaceTypeFilterEnum = z.enum(["CURATED", "RESERVABLE"], {
  error: V.admin.placeType.invalid.message,
});

/**
 * Claim status filter enum values
 */
const ClaimStatusFilterEnum = z.enum(
  ["UNCLAIMED", "CLAIM_PENDING", "CLAIMED", "REMOVAL_REQUESTED"],
  { error: V.admin.claimStatus.invalid.message },
);

/**
 * Schema for admin place list filters
 */
export const AdminCourtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  placeType: PlaceTypeFilterEnum.optional(),
  claimStatus: ClaimStatusFilterEnum.optional(),
  featured: z.boolean().optional(),
  province: S.place.province.optional(),
  city: S.place.city.optional(),
  search: S.place.searchQuery.optional(),
  sortBy: z
    .enum(["name", "city", "createdAt", "status"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export type AdminCourtFiltersDTO = z.infer<typeof AdminCourtFiltersSchema>;
