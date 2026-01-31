import { z } from "zod";
import { S, V } from "@/common/schemas";

export const MarkPaymentSchema = z.object({
  reservationId: S.ids.reservationId,
  termsAccepted: z.literal(true, {
    error: V.reservation.termsAccepted.message,
  }),
});

export type MarkPaymentDTO = z.infer<typeof MarkPaymentSchema>;
