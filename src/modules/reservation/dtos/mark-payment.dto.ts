import { z } from "zod";

export const MarkPaymentSchema = z.object({
  reservationId: z.string().uuid(),
  termsAccepted: z.literal(true, {
    message: "Terms must be accepted",
  }),
});

export type MarkPaymentDTO = z.infer<typeof MarkPaymentSchema>;
