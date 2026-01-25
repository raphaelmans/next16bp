import { z } from "zod";

export const DeleteRowSchema = z.object({
  rowId: z.string().uuid(),
});

export type DeleteRowDTO = z.infer<typeof DeleteRowSchema>;
