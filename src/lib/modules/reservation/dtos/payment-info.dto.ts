import { z } from "zod";
import { S } from "@/common/schemas";

export const GetPaymentInfoSchema = z.object({
  reservationId: S.ids.reservationId,
});

export type GetPaymentInfoDTO = z.infer<typeof GetPaymentInfoSchema>;
