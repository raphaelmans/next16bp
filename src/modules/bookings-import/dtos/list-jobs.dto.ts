import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const ListJobsSchema = z.object({
  placeId: S.ids.placeId,
});

export type ListJobsDTO = z.infer<typeof ListJobsSchema>;
