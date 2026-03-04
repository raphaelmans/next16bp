import { z } from "zod";

export const StartGoogleOAuthSchema = z.object({
  redirect: z.string().trim().min(1).optional(),
});

export type StartGoogleOAuthDTO = z.infer<typeof StartGoogleOAuthSchema>;
