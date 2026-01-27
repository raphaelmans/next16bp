import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const ListCourtBlocksSchema = z.object({
  courtId: S.ids.courtId,
  startTime: S.common.isoDateTime,
  endTime: S.common.isoDateTime,
});

export type ListCourtBlocksDTO = z.infer<typeof ListCourtBlocksSchema>;
