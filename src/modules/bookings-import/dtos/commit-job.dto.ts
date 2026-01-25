import { z } from "zod";

export const CommitJobSchema = z.object({
  jobId: z.string().uuid(),
});

export type CommitJobDTO = z.infer<typeof CommitJobSchema>;

export const CommitResultSchema = z.object({
  jobId: z.string().uuid(),
  status: z.string(),
  totalRows: z.number().int(),
  committedRows: z.number().int(),
  skippedRows: z.number().int(),
  failedRows: z.number().int(),
  failures: z.array(
    z.object({
      rowId: z.string().uuid(),
      lineNumber: z.number().int(),
      error: z.string(),
    }),
  ),
});

export type CommitResult = z.infer<typeof CommitResultSchema>;
