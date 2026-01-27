import { z } from "zod";
import { allowEmptyString, S, V } from "@/shared/kernel/schemas";

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

const optionalUrl = allowEmptyString(S.common.url().optional());
const optionalText = (max: { value: number; message: string }) =>
  allowEmptyString(
    z.string().trim().max(max.value, { error: max.message }).optional(),
  );

const courtSchema = z.object({
  label: S.court.label,
  sportId: S.ids.sportId,
  tierLabel: S.court.tierLabel.nullable(),
});

const photoSchema = z.object({
  url: allowEmptyString(S.common.url().optional()),
});

export const curatedCourtSchema = z.object({
  name: S.place.name,
  address: S.place.address,
  city: S.place.city,
  province: S.place.province,
  country: S.common.country,
  timeZone: S.place.timeZone.optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  extGPlaceId: optionalText(V.place.googlePlaceId.max),
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  phoneNumber: optionalText(V.place.phoneNumber.max),
  viberContact: optionalText(V.place.viberInfo.max),
  websiteUrl: optionalUrl,
  otherContactInfo: optionalText(V.place.otherContactInfo.max),
  amenities: z.array(S.place.amenity),
  photos: z.array(photoSchema).optional(),
  courts: z
    .array(courtSchema)
    .min(S.court.listMin.value, { error: S.court.listMin.message }),
});

export type CuratedCourtFormData = z.infer<typeof curatedCourtSchema>;
