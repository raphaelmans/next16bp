import { z } from "zod";
import {
  PAYMENT_METHOD_PROVIDERS,
  PAYMENT_METHOD_TYPES,
} from "@/common/payment-methods";
import { S, V } from "@/common/schemas";

export const coachProfileBasicsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  tagline: z.string().trim().min(1, "Tagline is required").max(300),
  bio: z.string().trim().min(1, "Bio is required").max(5000),
});

export type CoachProfileBasicsFormData = z.infer<
  typeof coachProfileBasicsSchema
>;

export const coachSportsSelectionSchema = z.object({
  sportIds: z.array(S.ids.sportId).min(1, "Choose at least one sport"),
});

export type CoachSportsSelectionFormData = z.infer<
  typeof coachSportsSelectionSchema
>;

export const coachPaymentMethodSchema = z.object({
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

export type CoachPaymentMethodFormData = z.infer<
  typeof coachPaymentMethodSchema
>;
