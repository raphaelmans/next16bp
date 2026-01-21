import { z } from "zod";

export const ListPlacesSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  province: z.string().min(1).max(100).optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  sportId: z.string().uuid().optional(),
  amenities: z.array(z.string().min(1).max(100)).optional(),
  verificationTier: z
    .enum(["verified_reservable", "curated", "unverified_reservable"])
    .optional(),
  featuredOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const GetPlaceByIdSchema = z.object({
  placeId: z.string().uuid(),
});

export const GetPlaceByIdOrSlugSchema = z.object({
  placeIdOrSlug: z.string().trim().min(1).max(200),
});

export const CreatePlaceSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z.string().trim().min(1).max(200).optional(),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  country: z.string().length(2).optional(),
  latitude: z
    .string()
    .regex(/^-?\d+\.\d+$/, "Invalid latitude format")
    .optional(),
  longitude: z
    .string()
    .regex(/^-?\d+\.\d+$/, "Invalid longitude format")
    .optional(),
  timeZone: z.string().min(1).max(64).optional(),
  websiteUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  phoneNumber: z.string().max(20).optional(),
  viberInfo: z.string().max(100).optional(),
  otherContactInfo: z.string().max(500).optional(),
});

export const UpdatePlaceSchema = z.object({
  placeId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  slug: z.string().trim().min(1).max(200).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).max(100).optional(),
  province: z.string().min(1).max(100).optional(),
  country: z.string().length(2).optional(),
  latitude: z
    .string()
    .regex(/^-?\d+\.\d+$/, "Invalid latitude format")
    .optional(),
  longitude: z
    .string()
    .regex(/^-?\d+\.\d+$/, "Invalid longitude format")
    .optional(),
  timeZone: z.string().min(1).max(64).optional(),
  websiteUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  phoneNumber: z.string().max(20).optional(),
  viberInfo: z.string().max(100).optional(),
  otherContactInfo: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const DeletePlaceSchema = z.object({
  placeId: z.string().uuid(),
});

export const ListMyPlacesSchema = z.object({
  organizationId: z.string().uuid(),
});

export type ListPlacesDTO = z.infer<typeof ListPlacesSchema>;
export type GetPlaceByIdDTO = z.infer<typeof GetPlaceByIdSchema>;
export type GetPlaceByIdOrSlugDTO = z.infer<typeof GetPlaceByIdOrSlugSchema>;
export type CreatePlaceDTO = z.infer<typeof CreatePlaceSchema>;
export type UpdatePlaceDTO = z.infer<typeof UpdatePlaceSchema>;
export type DeletePlaceDTO = z.infer<typeof DeletePlaceSchema>;
export type ListMyPlacesDTO = z.infer<typeof ListMyPlacesSchema>;
