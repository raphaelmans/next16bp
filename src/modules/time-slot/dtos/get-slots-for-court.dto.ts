import { z } from "zod";

export const GetSlotsForCourtSchema = z.object({
  courtId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type GetSlotsForCourtDTO = z.infer<typeof GetSlotsForCourtSchema>;
