import type { z } from "zod";
import {
  defaultPlaceFormValues,
  type PlaceFormData,
  type placeFormSchema,
} from "../schemas";

export type PlaceFormValues = z.input<typeof placeFormSchema>;

export const SAMPLE_GOOGLE_URL = "https://maps.app.goo.gl/6AGA5vZkzKazGswRA";

export const buildFormDefaults = (
  values?: Partial<PlaceFormValues>,
): PlaceFormValues => ({
  name: values?.name ?? "",
  address: values?.address ?? "",
  city: values?.city ?? "",
  province: values?.province ?? "",
  latitude: values?.latitude,
  longitude: values?.longitude,
  isActive: values?.isActive ?? defaultPlaceFormValues.isActive ?? true,
  websiteUrl: values?.websiteUrl ?? "",
  facebookUrl: values?.facebookUrl ?? "",
  instagramUrl: values?.instagramUrl ?? "",
  phoneNumber: values?.phoneNumber ?? "",
  viberInfo: values?.viberInfo ?? "",
  otherContactInfo: values?.otherContactInfo ?? "",
  amenities: values?.amenities ?? defaultPlaceFormValues.amenities ?? [],
});

export const normalizeFormValues = (
  values: PlaceFormValues,
): PlaceFormData => ({
  name: values.name.trim(),
  address: values.address.trim(),
  city: values.city.trim(),
  province: values.province.trim(),
  latitude:
    values.latitude === undefined || Number.isNaN(values.latitude)
      ? undefined
      : values.latitude,
  longitude:
    values.longitude === undefined || Number.isNaN(values.longitude)
      ? undefined
      : values.longitude,
  isActive: values.isActive ?? defaultPlaceFormValues.isActive ?? true,
  websiteUrl: values.websiteUrl?.trim() ? values.websiteUrl.trim() : undefined,
  facebookUrl: values.facebookUrl?.trim()
    ? values.facebookUrl.trim()
    : undefined,
  instagramUrl: values.instagramUrl?.trim()
    ? values.instagramUrl.trim()
    : undefined,
  phoneNumber: values.phoneNumber?.trim()
    ? values.phoneNumber.trim()
    : undefined,
  viberInfo: values.viberInfo?.trim() ? values.viberInfo.trim() : undefined,
  otherContactInfo: values.otherContactInfo?.trim()
    ? values.otherContactInfo.trim()
    : undefined,
  amenities: Array.isArray(values.amenities)
    ? values.amenities
    : (defaultPlaceFormValues.amenities ?? []),
});
