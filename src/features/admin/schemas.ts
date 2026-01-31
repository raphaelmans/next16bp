import { z } from "zod";
import { allowEmptyString, S, V } from "@/common/schemas";

// ============================================================================
// Shared helpers
// ============================================================================

const optionalUrlSchema = allowEmptyString(S.common.url().optional());

const optionalTextSchema = (max: { value: number; message: string }) =>
  allowEmptyString(
    z.string().trim().max(max.value, { error: max.message }).optional(),
  );

const coordinateSchema = S.common.coordinateString;

const courtSchemaBase = z.object({
  label: S.court.label,
  sportId: S.ids.sportId,
  tierLabel: S.court.tierLabel.nullable(),
});

const photoSchema = z.object({
  url: allowEmptyString(S.common.url().optional()),
});

// ============================================================================
// Admin Court Edit
// ============================================================================

const courtSchemaWithId = courtSchemaBase.extend({
  id: S.ids.courtId.optional(),
});

export const adminCourtEditSchema = z.object({
  name: S.place.name,
  address: S.place.address,
  province: S.place.province,
  city: S.place.city,
  country: S.common.country,
  latitude: coordinateSchema.latitude,
  longitude: coordinateSchema.longitude,
  extGPlaceId: optionalTextSchema(V.place.googlePlaceId.max),
  timeZone: S.place.timeZone.optional(),
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  phoneNumber: optionalTextSchema(V.place.phoneNumber.max),
  viberInfo: optionalTextSchema(V.place.viberInfo.max),
  websiteUrl: optionalUrlSchema,
  otherContactInfo: optionalTextSchema(V.place.otherContactInfo.max),
  amenities: z.array(S.place.amenity),
  courts: z
    .array(courtSchemaWithId)
    .min(S.court.listMin.value, { error: S.court.listMin.message }),
});

export type AdminCourtEditFormData = z.infer<typeof adminCourtEditSchema>;

// ============================================================================
// Curated Court Batch
// ============================================================================

export const curatedCourtBatchItemSchema = z.object({
  name: S.place.name,
  address: S.place.address,
  city: S.place.city,
  province: S.place.province,
  country: S.common.country,
  latitude: coordinateSchema.latitude,
  longitude: coordinateSchema.longitude,
  extGPlaceId: optionalTextSchema(V.place.googlePlaceId.max),
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  phoneNumber: optionalTextSchema(V.place.phoneNumber.max),
  viberContact: optionalTextSchema(V.place.viberInfo.max),
  websiteUrl: optionalUrlSchema,
  otherContactInfo: optionalTextSchema(V.place.otherContactInfo.max),
  amenities: z.array(S.place.amenity),
  courts: z
    .array(courtSchemaBase)
    .min(S.court.listMin.value, { error: S.court.listMin.message }),
});

export const curatedCourtBatchSchema = z.object({
  courts: z
    .array(curatedCourtBatchItemSchema)
    .min(S.common.itemsMin.value, { error: S.common.itemsMin.message }),
});

export type CuratedCourtBatchFormData = z.infer<typeof curatedCourtBatchSchema>;

// ============================================================================
// Curated Court (single)
// ============================================================================

export const CITIES = [
  "Makati",
  "BGC",
  "Pasig",
  "Quezon City",
  "Manila",
  "Taguig",
  "Mandaluyong",
  "San Juan",
  "Parañaque",
  "Las Piñas",
  "Muntinlupa",
  "Alabang",
];

export const AMENITIES = [
  "Parking",
  "Restrooms",
  "Lights",
  "Showers",
  "Locker Rooms",
  "Equipment Rental",
  "Pro Shop",
  "Seating Area",
  "Food/Drinks",
  "WiFi",
  "Air Conditioning",
  "Covered Courts",
  "Pet Friendly",
];

export const curatedCourtSchema = z.object({
  name: S.place.name,
  address: S.place.address,
  city: S.place.city,
  province: S.place.province,
  country: S.common.country,
  timeZone: S.place.timeZone.optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  extGPlaceId: optionalTextSchema(V.place.googlePlaceId.max),
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  phoneNumber: optionalTextSchema(V.place.phoneNumber.max),
  viberContact: optionalTextSchema(V.place.viberInfo.max),
  websiteUrl: optionalUrlSchema,
  otherContactInfo: optionalTextSchema(V.place.otherContactInfo.max),
  amenities: z.array(S.place.amenity),
  photos: z.array(photoSchema).optional(),
  courts: z
    .array(courtSchemaBase)
    .min(S.court.listMin.value, { error: S.court.listMin.message }),
});

export type CuratedCourtFormData = z.infer<typeof curatedCourtSchema>;
