import { z } from "zod";

export const ListRowsSchema = z.object({
  jobId: z.string().uuid(),
});

export type ListRowsDTO = z.infer<typeof ListRowsSchema>;
