import { z } from "zod";
import {
  PAYMENT_METHOD_PROVIDERS,
  PAYMENT_METHOD_TYPES,
} from "@/common/payment-methods";
import { allowEmptyString, S, V } from "@/common/schemas";

// ============================================================================
// From court-form.schema.ts
// ============================================================================

export const courtFormSchema = z.object({
  placeId: S.ids.placeId,
  sportId: S.ids.sportId,
  label: S.court.label,
  tierLabel: S.court.tierLabel.nullable(),
  isActive: z.boolean().default(true),
});

export type CourtFormData = z.infer<typeof courtFormSchema>;

export const defaultCourtFormValues: Partial<CourtFormData> = {
  isActive: true,
};

// ============================================================================
// From organization-payment-method.schema.ts
// ============================================================================

export const organizationPaymentMethodSchema = z.object({
  type: z.enum(PAYMENT_METHOD_TYPES, {
    error: V.paymentMethod.type.invalid.message,
  }),
  provider: z.enum(PAYMENT_METHOD_PROVIDERS, {
    error: V.paymentMethod.provider.invalid.message,
  }),
  accountName: S.paymentMethod.accountName,
  accountNumber: S.paymentMethod.accountNumber,
  instructions: S.paymentMethod.instructions,
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type OrganizationPaymentMethodFormData = z.infer<
  typeof organizationPaymentMethodSchema
>;

// ============================================================================
// From organization.schema.ts
// ============================================================================

export const organizationSchema = z.object({
  name: S.organization.name,
  slug: S.organization.slug,
  description: S.organization.description.optional(),
  email: allowEmptyString(S.common.email.optional()),
  phone: allowEmptyString(S.common.phone.optional()),
  address: S.organization.address,
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

export const removalRequestSchema = z.object({
  reason: S.claimRequest.removalReason,
  acknowledgeReservations: z.boolean().refine((val) => val === true, {
    error: V.claimRequest.acknowledgeReservations.message,
  }),
  acknowledgeApproval: z.boolean().refine((val) => val === true, {
    error: V.claimRequest.acknowledgeApproval.message,
  }),
});

export type RemovalRequestFormData = z.infer<typeof removalRequestSchema>;

// ============================================================================
// From place-form.schema.ts
// ============================================================================

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
  amenities: z.array(S.place.amenity).default([]),
});

export type PlaceFormData = z.infer<typeof placeFormSchema>;

export const defaultPlaceFormValues: Partial<PlaceFormData> = {
  timeZone: "Asia/Manila",
  country: "PH",
  isActive: true,
  amenities: [],
};

export const PLACE_TIME_ZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
];
