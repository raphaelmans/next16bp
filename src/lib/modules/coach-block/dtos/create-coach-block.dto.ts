import { z } from "zod";
import { S } from "@/common/schemas";

export const CreateCoachBlockSchema = z
  .object({
    coachId: S.ids.coachId,
    startTime: S.common.isoDateTime,
    endTime: S.common.isoDateTime,
    reason: z.string().trim().max(500).optional(),
    blockType: z.enum(["PERSONAL", "EXTERNAL_BOOKING", "OTHER"]).optional(),
  })
  .refine((input) => input.startTime < input.endTime, {
    error: "Start time must be before end time",
    path: ["startTime"],
  });

export type CreateCoachBlockDTO = z.infer<typeof CreateCoachBlockSchema>;
