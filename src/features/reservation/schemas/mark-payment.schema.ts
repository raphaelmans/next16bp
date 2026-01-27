import { z } from "zod";
import { allowEmptyString, S, V } from "@/shared/kernel/schemas";

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
