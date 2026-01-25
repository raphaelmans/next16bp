import { z } from "zod";

export const UpdateRowSchema = z.object({
  rowId: z.string().uuid(),
  courtId: z.string().uuid().nullable().optional(),
  courtLabel: z.string().max(100).nullable().optional(),
  startTime: z.coerce.date().nullable().optional(),
  endTime: z.coerce.date().nullable().optional(),
  reason: z.string().max(500).nullable().optional(),
});

export type UpdateRowDTO = z.infer<typeof UpdateRowSchema>;
