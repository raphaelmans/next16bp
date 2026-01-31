import { z } from "zod";
import { S } from "@/common/schemas";

export const CancelCourtBlockSchema = z.object({
  blockId: S.ids.blockId,
});

export type CancelCourtBlockDTO = z.infer<typeof CancelCourtBlockSchema>;
