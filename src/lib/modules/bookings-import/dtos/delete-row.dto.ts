import { z } from "zod";
import { S } from "@/common/schemas";

export const DeleteRowSchema = z.object({
  rowId: S.ids.rowId,
});

export type DeleteRowDTO = z.infer<typeof DeleteRowSchema>;
