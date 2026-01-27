import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const ListRowsSchema = z.object({
  jobId: S.ids.jobId,
});

export type ListRowsDTO = z.infer<typeof ListRowsSchema>;
