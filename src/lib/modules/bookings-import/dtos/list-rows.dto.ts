import { z } from "zod";
import { S } from "@/common/schemas";

export const ListRowsSchema = z.object({
  jobId: S.ids.jobId,
});

export type ListRowsDTO = z.infer<typeof ListRowsSchema>;
