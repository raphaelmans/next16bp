import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const CancelCourtBlockSchema = z.object({
  blockId: S.ids.blockId,
});

export type CancelCourtBlockDTO = z.infer<typeof CancelCourtBlockSchema>;
