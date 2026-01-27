import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const VerifyTokenHashSchema = z.object({
  token_hash: S.common.requiredText,
});

export type VerifyTokenHashDTO = z.infer<typeof VerifyTokenHashSchema>;
