import { z } from "zod";
import { allowEmptyString, S, V } from "@/shared/kernel/schemas";

const optionalUrlSchema = allowEmptyString(S.common.url().optional());

const optionalTextSchema = (max: { value: number; message: string }) =>
  allowEmptyString(
    z.string().trim().max(max.value, { error: max.message }).optional(),
  );

const coordinateSchema = S.common.coordinateString;

const courtSchema = z.object({
  id: S.ids.courtId.optional(),
  label: S.court.label,
  sportId: S.ids.sportId,
  tierLabel: S.court.tierLabel.nullable(),
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
    .array(courtSchema)
    .min(S.court.listMin.value, { error: S.court.listMin.message }),
});

export type AdminCourtEditFormData = z.infer<typeof adminCourtEditSchema>;
