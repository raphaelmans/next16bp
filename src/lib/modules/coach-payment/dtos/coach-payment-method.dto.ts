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

export const ListCoachPaymentMethodsSchema = z.object({
  coachId: S.ids.coachId,
});

export const CreateCoachPaymentMethodSchema = z.object({
  coachId: S.ids.coachId,
  type: PaymentMethodTypeSchema,
  provider: PaymentMethodProviderSchema,
  accountName: S.paymentMethod.accountName,
  accountNumber: S.paymentMethod.accountNumber,
  instructions: S.paymentMethod.instructions,
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const UpdateCoachPaymentMethodSchema = z.object({
  paymentMethodId: S.ids.paymentMethodId,
  type: PaymentMethodTypeSchema.optional(),
  provider: PaymentMethodProviderSchema.optional(),
  accountName: S.paymentMethod.accountName.optional(),
  accountNumber: S.paymentMethod.accountNumber.optional(),
  instructions: S.paymentMethod.instructions.nullish(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const DeleteCoachPaymentMethodSchema = z.object({
  paymentMethodId: S.ids.paymentMethodId,
});

export const SetDefaultCoachPaymentMethodSchema = z.object({
  paymentMethodId: S.ids.paymentMethodId,
});

export type ListCoachPaymentMethodsDTO = z.infer<
  typeof ListCoachPaymentMethodsSchema
>;
export type CreateCoachPaymentMethodDTO = z.infer<
  typeof CreateCoachPaymentMethodSchema
>;
export type UpdateCoachPaymentMethodDTO = z.infer<
  typeof UpdateCoachPaymentMethodSchema
>;
export type DeleteCoachPaymentMethodDTO = z.infer<
  typeof DeleteCoachPaymentMethodSchema
>;
export type SetDefaultCoachPaymentMethodDTO = z.infer<
  typeof SetDefaultCoachPaymentMethodSchema
>;
