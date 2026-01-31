import { z } from "zod";
import { S } from "@/common/schemas";
import { CreateCuratedCourtSchema } from "./create-curated-court.dto";

/**
 * Schema for creating curated places in batch (admin only)
 */
export const CreateCuratedCourtBatchSchema = z.object({
  items: z
    .array(CreateCuratedCourtSchema)
    .min(S.common.itemsMin.value, { error: S.common.itemsMin.message }),
});

export type CreateCuratedCourtBatchDTO = z.infer<
  typeof CreateCuratedCourtBatchSchema
>;
