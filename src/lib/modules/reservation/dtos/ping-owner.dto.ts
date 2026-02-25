import { z } from "zod";
import { S } from "@/common/schemas";

export const PingOwnerSchema = z.object({
  reservationId: S.ids.reservationId,
});

export type PingOwnerDTO = z.infer<typeof PingOwnerSchema>;
