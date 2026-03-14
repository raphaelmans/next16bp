import { z } from "zod";
import { S } from "@/common/schemas";

export const ListCoachBlocksSchema = z
  .object({
    coachId: S.ids.coachId,
    startTime: S.common.isoDateTime,
    endTime: S.common.isoDateTime,
  })
  .refine((input) => input.startTime < input.endTime, {
    error: "Start time must be before end time",
    path: ["startTime"],
  });

export type ListCoachBlocksDTO = z.infer<typeof ListCoachBlocksSchema>;
