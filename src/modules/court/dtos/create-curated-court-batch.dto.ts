import { z } from "zod";
import { CreateCuratedCourtSchema } from "./create-curated-court.dto";

/**
 * Schema for creating curated places in batch (admin only)
 */
export const CreateCuratedCourtBatchSchema = z.object({
  items: z.array(CreateCuratedCourtSchema).min(1),
});

export type CreateCuratedCourtBatchDTO = z.infer<
  typeof CreateCuratedCourtBatchSchema
>;
