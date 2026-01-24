import { z } from "zod";

export const CancelCourtBlockSchema = z.object({
  blockId: z.string().uuid(),
});

export type CancelCourtBlockDTO = z.infer<typeof CancelCourtBlockSchema>;
