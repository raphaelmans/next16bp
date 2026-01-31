import { z } from "zod";
import { S } from "@/common/schemas";

export const ListJobsSchema = z.object({
  placeId: S.ids.placeId,
});

export type ListJobsDTO = z.infer<typeof ListJobsSchema>;
