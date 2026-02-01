import { z } from "zod";
import { S } from "@/common/schemas";

export const ListRowsSchema = z.object({
  jobId: S.ids.jobId,
  limit: S.pagination.limit.default(100),
  offset: S.pagination.offset.default(0),
});

export type ListRowsDTO = z.infer<typeof ListRowsSchema>;
