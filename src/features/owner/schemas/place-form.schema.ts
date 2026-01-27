import { z } from "zod";
import { allowEmptyString, S, V } from "@/shared/kernel/schemas";

const optionalUrl = allowEmptyString(S.common.url().optional());
const optionalText = (max: { value: number; message: string }) =>
  allowEmptyString(
    z.string().trim().max(max.value, { error: max.message }).optional(),
  );

export const placeFormSchema = z.object({
  name: S.place.name,
  address: S.place.address,
  city: S.place.city,
  province: S.place.province,
  country: S.common.country.default("PH"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  timeZone: S.place.timeZone.default("Asia/Manila"),
  isActive: z.boolean().default(true),
  websiteUrl: optionalUrl,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  phoneNumber: optionalText(V.place.phoneNumber.max),
  viberInfo: optionalText(V.place.viberInfo.max),
  otherContactInfo: optionalText(V.place.otherContactInfo.max),
});

export type PlaceFormData = z.infer<typeof placeFormSchema>;

export const defaultPlaceFormValues: Partial<PlaceFormData> = {
  timeZone: "Asia/Manila",
  country: "PH",
  isActive: true,
};

export const PLACE_TIME_ZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
];
