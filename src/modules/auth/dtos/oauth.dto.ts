import { z } from "zod";

export const StartGoogleOAuthSchema = z.object({
  next: z.string().optional(),
});

export type StartGoogleOAuthDTO = z.infer<typeof StartGoogleOAuthSchema>;
