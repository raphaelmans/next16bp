import { z } from "zod";

export const ListCourtBlocksSchema = z.object({
  courtId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export type ListCourtBlocksDTO = z.infer<typeof ListCourtBlocksSchema>;
