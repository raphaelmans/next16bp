import { z } from "zod";
import { S, V } from "@/common/schemas";

export const NormalizeModeSchema = z.enum(["ai", "deterministic"], {
  error: V.bookingsImport.normalizeMode.invalid.message,
});

export type NormalizeMode = z.infer<typeof NormalizeModeSchema>;

export const NormalizeJobSchema = z
  .object({
    jobId: S.ids.jobId,
    mode: NormalizeModeSchema,
    confirmAiOnce: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // confirmAiOnce is required when mode is "ai"
    if (data.mode === "ai" && data.confirmAiOnce !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: V.bookingsImport.confirmAiOnce.message,
        path: ["confirmAiOnce"],
      });
    }
  });

export type NormalizeJobDTO = z.infer<typeof NormalizeJobSchema>;

export const NormalizeResultSchema = z.object({
  jobId: S.ids.jobId,
  status: z.string(),
  rowCount: z.number().int(),
  validRowCount: z.number().int(),
  errorRowCount: z.number().int(),
});

export type NormalizeResult = z.infer<typeof NormalizeResultSchema>;
