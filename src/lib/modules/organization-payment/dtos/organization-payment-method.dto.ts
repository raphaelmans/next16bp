import { z } from "zod";
import {
  PAYMENT_METHOD_PROVIDERS,
  PAYMENT_METHOD_TYPES,
} from "@/common/payment-methods";
import { S, V } from "@/common/schemas";

export const PaymentMethodTypeSchema = z.enum(PAYMENT_METHOD_TYPES, {
  error: V.paymentMethod.type.invalid.message,
});
export const PaymentMethodProviderSchema = z.enum(PAYMENT_METHOD_PROVIDERS, {
  error: V.paymentMethod.provider.invalid.message,
});

export const ListOrganizationPaymentMethodsSchema = z.object({
  organizationId: S.ids.organizationId,
});

export const CreateOrganizationPaymentMethodSchema = z.object({
  organizationId: S.ids.organizationId,
  type: PaymentMethodTypeSchema,
  provider: PaymentMethodProviderSchema,
  accountName: S.paymentMethod.accountName,
  accountNumber: S.paymentMethod.accountNumber,
  instructions: S.paymentMethod.instructions,
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  displayOrder: S.paymentMethod.displayOrder.optional(),
});

export const UpdateOrganizationPaymentMethodSchema = z.object({
  paymentMethodId: S.ids.paymentMethodId,
  type: PaymentMethodTypeSchema.optional(),
  provider: PaymentMethodProviderSchema.optional(),
  accountName: S.paymentMethod.accountName.optional(),
  accountNumber: S.paymentMethod.accountNumber.optional(),
  instructions: S.paymentMethod.instructions.nullish(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  displayOrder: S.paymentMethod.displayOrder.optional(),
});

export const DeleteOrganizationPaymentMethodSchema = z.object({
  paymentMethodId: S.ids.paymentMethodId,
});

export const SetDefaultOrganizationPaymentMethodSchema = z.object({
  paymentMethodId: S.ids.paymentMethodId,
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
