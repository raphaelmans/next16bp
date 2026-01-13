import { z } from "zod";
import {
  PAYMENT_METHOD_PROVIDERS,
  PAYMENT_METHOD_TYPES,
} from "@/shared/lib/payment-methods";

export const PaymentMethodTypeSchema = z.enum(PAYMENT_METHOD_TYPES);
export const PaymentMethodProviderSchema = z.enum(PAYMENT_METHOD_PROVIDERS);

export const ListOrganizationPaymentMethodsSchema = z.object({
  organizationId: z.string().uuid(),
});

export const CreateOrganizationPaymentMethodSchema = z.object({
  organizationId: z.string().uuid(),
  type: PaymentMethodTypeSchema,
  provider: PaymentMethodProviderSchema,
  accountName: z.string().min(1).max(150),
  accountNumber: z.string().min(1).max(50),
  instructions: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const UpdateOrganizationPaymentMethodSchema = z.object({
  paymentMethodId: z.string().uuid(),
  type: PaymentMethodTypeSchema.optional(),
  provider: PaymentMethodProviderSchema.optional(),
  accountName: z.string().min(1).max(150).optional(),
  accountNumber: z.string().min(1).max(50).optional(),
  instructions: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const DeleteOrganizationPaymentMethodSchema = z.object({
  paymentMethodId: z.string().uuid(),
});

export const SetDefaultOrganizationPaymentMethodSchema = z.object({
  paymentMethodId: z.string().uuid(),
});

export type ListOrganizationPaymentMethodsDTO = z.infer<
  typeof ListOrganizationPaymentMethodsSchema
>;
export type CreateOrganizationPaymentMethodDTO = z.infer<
  typeof CreateOrganizationPaymentMethodSchema
>;
export type UpdateOrganizationPaymentMethodDTO = z.infer<
  typeof UpdateOrganizationPaymentMethodSchema
>;
export type DeleteOrganizationPaymentMethodDTO = z.infer<
  typeof DeleteOrganizationPaymentMethodSchema
>;
export type SetDefaultOrganizationPaymentMethodDTO = z.infer<
  typeof SetDefaultOrganizationPaymentMethodSchema
>;
