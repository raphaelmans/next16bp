import { z } from "zod";

export const GetPaymentInfoSchema = z.object({
  reservationId: z.string().uuid(),
});

export type GetPaymentInfoDTO = z.infer<typeof GetPaymentInfoSchema>;
