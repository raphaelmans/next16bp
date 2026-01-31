import { z } from "zod";
import { S } from "@/common/schemas";

export const ListSourcesSchema = z.object({
  jobId: S.ids.jobId,
});

export type ListSourcesDTO = z.infer<typeof ListSourcesSchema>;
