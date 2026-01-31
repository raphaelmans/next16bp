import { z } from "zod";
import { allowEmptyString, S, V } from "@/common/schemas";

// ============================================================================
// From mark-payment.schema.ts
// ============================================================================

export const markPaymentSchema = z.object({
  reservationId: S.ids.reservationId,
  referenceNumber: allowEmptyString(S.reservation.referenceNumber.optional()),
  receiptUrl: S.common.url().optional(),
  notes: S.reservation.notes,
  disclaimerAcknowledged: z.boolean().refine((val) => val === true, {
    error: V.reservation.disclaimerAcknowledged.message,
  }),
  termsAccepted: z.literal(true, {
    error: V.reservation.termsAccepted.message,
  }),
});

export type MarkPaymentFormValues = z.infer<typeof markPaymentSchema>;

// ============================================================================
// From profile.schema.ts
// ============================================================================

export const profileSchema = z.object({
  displayName: S.profile.displayName,
  email: allowEmptyString(S.common.email.optional()),
  phoneNumber: allowEmptyString(S.profile.phoneNumber),
  avatarUrl: allowEmptyString(S.profile.avatarUrl.optional()),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
