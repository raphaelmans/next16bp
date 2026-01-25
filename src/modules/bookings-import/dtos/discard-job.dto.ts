import { z } from "zod";

export const DiscardJobSchema = z.object({
  jobId: z.string().uuid(),
});

export type DiscardJobDTO = z.infer<typeof DiscardJobSchema>;
