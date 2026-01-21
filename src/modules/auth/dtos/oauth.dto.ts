import { z } from "zod";

export const StartGoogleOAuthSchema = z.object({
  redirect: z.string().optional(),
});

export type StartGoogleOAuthDTO = z.infer<typeof StartGoogleOAuthSchema>;
