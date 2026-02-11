import { z } from "zod";
import { S } from "@/common/schemas";

export const RecuratePlaceSchema = z.object({
  placeId: S.ids.placeId,
  reason: S.claimRequest.reason,
});

export type RecuratePlaceDTO = z.infer<typeof RecuratePlaceSchema>;
