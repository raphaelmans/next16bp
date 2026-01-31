import { z } from "zod";
import { S } from "@/common/schemas";

export const DiscardJobSchema = z.object({
  jobId: S.ids.jobId,
});

export type DiscardJobDTO = z.infer<typeof DiscardJobSchema>;
