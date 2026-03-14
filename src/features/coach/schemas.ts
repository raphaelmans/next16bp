import { z } from "zod";
import {
  PAYMENT_METHOD_PROVIDERS,
  PAYMENT_METHOD_TYPES,
} from "@/common/payment-methods";
import { S, V } from "@/common/schemas";

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
