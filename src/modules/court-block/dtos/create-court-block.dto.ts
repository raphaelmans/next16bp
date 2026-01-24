import { z } from "zod";

export const CreateCourtBlockSchema = z.object({
  courtId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reason: z.string().trim().max(255).optional(),
});

export type CreateCourtBlockDTO = z.infer<typeof CreateCourtBlockSchema>;
