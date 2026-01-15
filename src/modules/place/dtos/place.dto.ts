import { z } from "zod";

export const ListPlacesSchema = z.object({
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  sportId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const GetPlaceByIdSchema = z.object({
  placeId: z.string().uuid(),
});

export const CreatePlaceSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  province: z.string().max(100).optional(),
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
  viberInfo: z.string().max(100).optional(),
  otherContactInfo: z.string().max(500).optional(),
});

export const UpdatePlaceSchema = z.object({
  placeId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).max(100).optional(),
  province: z.string().max(100).optional(),
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
  viberInfo: z.string().max(100).optional(),
  otherContactInfo: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const ListMyPlacesSchema = z.object({
  organizationId: z.string().uuid(),
});

export type ListPlacesDTO = z.infer<typeof ListPlacesSchema>;
export type GetPlaceByIdDTO = z.infer<typeof GetPlaceByIdSchema>;
export type CreatePlaceDTO = z.infer<typeof CreatePlaceSchema>;
export type UpdatePlaceDTO = z.infer<typeof UpdatePlaceSchema>;
export type ListMyPlacesDTO = z.infer<typeof ListMyPlacesSchema>;
