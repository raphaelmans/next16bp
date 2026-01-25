import { z } from "zod";

export const GetJobSchema = z.object({
  jobId: z.string().uuid(),
});

export type GetJobDTO = z.infer<typeof GetJobSchema>;
