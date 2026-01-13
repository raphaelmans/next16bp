import { z } from "zod";
import {
  PAYMENT_METHOD_PROVIDERS,
  PAYMENT_METHOD_TYPES,
} from "@/shared/lib/payment-methods";

export const organizationPaymentMethodSchema = z.object({
  type: z.enum(PAYMENT_METHOD_TYPES),
  provider: z.enum(PAYMENT_METHOD_PROVIDERS),
  accountName: z.string().min(1, "Account name is required").max(150),
  accountNumber: z.string().min(1, "Account number is required").max(50),
  instructions: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type OrganizationPaymentMethodFormData = z.infer<
  typeof organizationPaymentMethodSchema
>;
