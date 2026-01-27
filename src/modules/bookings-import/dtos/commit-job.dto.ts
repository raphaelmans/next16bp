import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const CommitJobSchema = z.object({
  jobId: S.ids.jobId,
});

export type CommitJobDTO = z.infer<typeof CommitJobSchema>;

export const CommitResultSchema = z.object({
  jobId: S.ids.jobId,
  status: z.string(),
  totalRows: z.number().int(),
  committedRows: z.number().int(),
  skippedRows: z.number().int(),
  failedRows: z.number().int(),
  failures: z.array(
    z.object({
      rowId: S.ids.rowId,
      lineNumber: z.number().int(),
      error: z.string(),
    }),
  ),
});

export type CommitResult = z.infer<typeof CommitResultSchema>;
