import { z } from "zod";
import { S } from "@/common/schemas";

export const GetAiUsageSchema = z.object({
  placeId: S.ids.placeId,
});

export type GetAiUsageDTO = z.infer<typeof GetAiUsageSchema>;
