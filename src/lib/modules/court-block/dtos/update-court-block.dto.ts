import { z } from "zod";
import { S } from "@/common/schemas";

export const UpdateCourtBlockRangeSchema = z.object({
  blockId: S.ids.blockId,
  startTime: S.common.isoDateTime,
  endTime: S.common.isoDateTime,
});

export type UpdateCourtBlockRangeDTO = z.infer<
  typeof UpdateCourtBlockRangeSchema
>;
