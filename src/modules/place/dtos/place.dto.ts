import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const ListPlacesSchema = z.object({
  q: S.place.searchQuery.optional(),
  province: S.place.province.optional(),
  city: S.common.requiredText.optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  sportId: S.ids.sportId.optional(),
  amenities: z.array(S.place.amenity).optional(),
  verificationTier: z
    .enum(["verified_reservable", "curated", "unverified_reservable"])
    .optional(),
  featuredOnly: z.boolean().optional(),
  limit: S.pagination.limit.default(20),
  offset: S.pagination.offset.default(0),
});

export const ListPlaceCardMediaSchema = z.object({
  placeIds: z.array(S.ids.placeId),
});

export const ListPlaceCardMetaSchema = z.object({
  placeIds: z.array(S.ids.placeId),
  sportId: S.ids.sportId.optional(),
});

export const GetPlaceByIdSchema = z.object({
  placeId: S.ids.placeId,
});

export const GetPlaceByIdOrSlugSchema = z.object({
  placeIdOrSlug: S.place.idOrSlug,
});

export const CreatePlaceSchema = z.object({
  organizationId: S.ids.organizationId,
  name: S.place.name,
  address: S.place.address,
  city: S.place.city,
  province: S.place.province,
  country: S.common.country.optional(),
  latitude: S.common.coordinateString.latitude,
  longitude: S.common.coordinateString.longitude,
  timeZone: S.place.timeZone.optional(),
  websiteUrl: S.common.url().optional(),
  facebookUrl: S.common.url().optional(),
  instagramUrl: S.common.url().optional(),
  phoneNumber: S.place.phoneNumber,
  viberInfo: S.place.viberInfo,
  otherContactInfo: S.place.otherContactInfo,
});

export const UpdatePlaceSchema = z.object({
  placeId: S.ids.placeId,
  name: S.place.name.optional(),
  address: S.place.address.optional(),
  city: S.place.city.optional(),
  province: S.place.province.optional(),
  country: S.common.country.optional(),
  latitude: S.common.coordinateString.latitude,
  longitude: S.common.coordinateString.longitude,
  timeZone: S.place.timeZone.optional(),
  websiteUrl: S.common.url().optional(),
  facebookUrl: S.common.url().optional(),
  instagramUrl: S.common.url().optional(),
  phoneNumber: S.place.phoneNumber,
  viberInfo: S.place.viberInfo,
  otherContactInfo: S.place.otherContactInfo,
  isActive: z.boolean().optional(),
});

export const DeletePlaceSchema = z.object({
  placeId: S.ids.placeId,
});

export const ListMyPlacesSchema = z.object({
  organizationId: S.ids.organizationId,
});

export type ListPlacesDTO = z.infer<typeof ListPlacesSchema>;
export type ListPlaceCardMediaDTO = z.infer<typeof ListPlaceCardMediaSchema>;
export type ListPlaceCardMetaDTO = z.infer<typeof ListPlaceCardMetaSchema>;
export type GetPlaceByIdDTO = z.infer<typeof GetPlaceByIdSchema>;
export type GetPlaceByIdOrSlugDTO = z.infer<typeof GetPlaceByIdOrSlugSchema>;
export type CreatePlaceDTO = z.infer<typeof CreatePlaceSchema>;
export type UpdatePlaceDTO = z.infer<typeof UpdatePlaceSchema>;
export type DeletePlaceDTO = z.infer<typeof DeletePlaceSchema>;
export type ListMyPlacesDTO = z.infer<typeof ListMyPlacesSchema>;
