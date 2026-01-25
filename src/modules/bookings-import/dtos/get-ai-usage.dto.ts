import { z } from "zod";

export const GetAiUsageSchema = z.object({
  placeId: z.string().uuid(),
});

export type GetAiUsageDTO = z.infer<typeof GetAiUsageSchema>;
