import { z } from "zod";
import { S, V } from "@/shared/kernel/schemas";
import {
  PAYMENT_METHOD_PROVIDERS,
  PAYMENT_METHOD_TYPES,
} from "@/shared/lib/payment-methods";

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
