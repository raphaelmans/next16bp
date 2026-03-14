import { z } from "zod";
import { S } from "@/common/schemas";

export const DeleteCoachBlockSchema = z.object({
  coachId: S.ids.coachId,
  blockId: S.ids.blockId,
});

export type DeleteCoachBlockDTO = z.infer<typeof DeleteCoachBlockSchema>;
