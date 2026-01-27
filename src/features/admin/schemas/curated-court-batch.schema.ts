import { z } from "zod";
import { allowEmptyString, S, V } from "@/shared/kernel/schemas";

export { AMENITIES, CITIES } from "./curated-court.schema";

const optionalUrlSchema = allowEmptyString(S.common.url().optional());
const optionalText = (max: { value: number; message: string }) =>
  allowEmptyString(
    z.string().trim().max(max.value, { error: max.message }).optional(),
  );

const courtSchema = z.object({
  label: S.court.label,
  sportId: S.ids.sportId,
  tierLabel: S.court.tierLabel.nullable(),
});

const coordinateSchema = S.common.coordinateString;

export const curatedCourtBatchItemSchema = z.object({
  name: S.place.name,
  address: S.place.address,
  city: S.place.city,
  province: S.place.province,
  country: S.common.country,
  latitude: coordinateSchema.latitude,
  longitude: coordinateSchema.longitude,
  extGPlaceId: optionalText(V.place.googlePlaceId.max),
  facebookUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  phoneNumber: optionalText(V.place.phoneNumber.max),
  viberContact: optionalText(V.place.viberInfo.max),
  websiteUrl: optionalUrlSchema,
  otherContactInfo: optionalText(V.place.otherContactInfo.max),
  amenities: z.array(S.place.amenity),
  courts: z
    .array(courtSchema)
    .min(S.court.listMin.value, { error: S.court.listMin.message }),
});

export const curatedCourtBatchSchema = z.object({
  courts: z
    .array(curatedCourtBatchItemSchema)
    .min(S.common.itemsMin.value, { error: S.common.itemsMin.message }),
});

export type CuratedCourtBatchFormData = z.infer<typeof curatedCourtBatchSchema>;
