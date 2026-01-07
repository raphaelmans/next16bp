import { z } from "zod";

export const markPaymentSchema = z.object({
  reservationId: z.string().min(1, "Reservation ID is required"),
  referenceNumber: z.string().min(1, "Reference number is required"),
  receiptUrl: z.string().url().optional(),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  disclaimerAcknowledged: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the payment disclaimer",
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

export type MarkPaymentFormValues = z.infer<typeof markPaymentSchema>;
