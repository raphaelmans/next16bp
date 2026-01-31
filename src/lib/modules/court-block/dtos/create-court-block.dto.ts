import { z } from "zod";
import { S } from "@/common/schemas";

export const CreateCourtBlockSchema = z.object({
  courtId: S.ids.courtId,
  startTime: S.common.isoDateTime,
  endTime: S.common.isoDateTime,
  reason: S.courtBlock.reason,
});

export type CreateCourtBlockDTO = z.infer<typeof CreateCourtBlockSchema>;
