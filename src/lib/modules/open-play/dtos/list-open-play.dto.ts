import { z } from "zod";
import { S } from "@/common/schemas";

export const ListOpenPlaysByPlaceSchema = z.object({
  placeId: S.ids.placeId,
  fromIso: S.common.isoDateTime.optional(),
  toIso: S.common.isoDateTime.optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type ListOpenPlaysByPlaceDTO = z.infer<
  typeof ListOpenPlaysByPlaceSchema
>;
