import { z } from "zod";

export const ListJobsSchema = z.object({
  placeId: z.string().uuid(),
});

export type ListJobsDTO = z.infer<typeof ListJobsSchema>;
