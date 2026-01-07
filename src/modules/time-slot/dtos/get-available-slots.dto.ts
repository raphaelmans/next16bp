import { z } from "zod";

export const GetAvailableSlotsSchema = z.object({
  courtId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type GetAvailableSlotsDTO = z.infer<typeof GetAvailableSlotsSchema>;
