import { z } from "zod";

export const NormalizeModeSchema = z.enum(["ai", "deterministic"]);

export type NormalizeMode = z.infer<typeof NormalizeModeSchema>;

export const NormalizeJobSchema = z
  .object({
    jobId: z.string().uuid(),
    mode: NormalizeModeSchema,
    confirmAiOnce: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // confirmAiOnce is required when mode is "ai"
    if (data.mode === "ai" && data.confirmAiOnce !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "confirmAiOnce must be true when using AI mode (one-time per venue)",
        path: ["confirmAiOnce"],
      });
    }
  });

export type NormalizeJobDTO = z.infer<typeof NormalizeJobSchema>;

export const NormalizeResultSchema = z.object({
  jobId: z.string().uuid(),
  status: z.string(),
  rowCount: z.number().int(),
  validRowCount: z.number().int(),
  errorRowCount: z.number().int(),
});

export type NormalizeResult = z.infer<typeof NormalizeResultSchema>;
