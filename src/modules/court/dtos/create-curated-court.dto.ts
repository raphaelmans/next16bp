import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

/**
 * Photo input for creating a place
 */
const PhotoInputSchema = z.object({
  url: S.common.url(),
  displayOrder: S.common.displayOrder.optional(),
});

/**
 * Court input for curated places
 */
const CourtInputSchema = z.object({
  label: S.court.label,
  sportId: S.ids.sportId,
  tierLabel: S.court.tierLabel.nullish(),
});

/**
 * Schema for creating a curated place (admin only)
 */
export const CreateCuratedCourtSchema = z.object({
  name: S.place.name,
  address: S.place.address,
  city: S.place.city,
  province: S.place.province,
  country: S.common.country.optional(),
  latitude: S.common.coordinateInput.latitude,
  longitude: S.common.coordinateInput.longitude,
  extGPlaceId: S.place.googlePlaceId,
  timeZone: S.place.timeZone.optional(),
  // Curated detail fields
  facebookUrl: S.common.url().optional(),
  phoneNumber: S.place.phoneNumber,
  viberInfo: S.place.viberInfo,
  instagramUrl: S.common.url().optional(),
  websiteUrl: S.common.url().optional(),
  otherContactInfo: S.place.otherContactInfo,
  // Related data
  photos: z.array(PhotoInputSchema).optional(),
  amenities: z.array(S.place.amenity).optional(),
  courts: z
    .array(CourtInputSchema)
    .min(S.court.listMin.value, { error: S.court.listMin.message }),
});

export type CreateCuratedCourtDTO = z.infer<typeof CreateCuratedCourtSchema>;
