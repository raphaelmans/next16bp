import { z } from "zod";

export const VerifyTokenHashSchema = z.object({
  token_hash: z.string(),
});

export type VerifyTokenHashDTO = z.infer<typeof VerifyTokenHashSchema>;
