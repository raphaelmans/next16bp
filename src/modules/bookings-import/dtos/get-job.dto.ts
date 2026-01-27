import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const GetJobSchema = z.object({
  jobId: S.ids.jobId,
});

export type GetJobDTO = z.infer<typeof GetJobSchema>;
