import { z } from "zod";
import { S } from "@/common/schemas";

export const GetJobSchema = z.object({
  jobId: S.ids.jobId,
});

export type GetJobDTO = z.infer<typeof GetJobSchema>;
