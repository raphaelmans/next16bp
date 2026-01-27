import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const StartGoogleOAuthSchema = z.object({
  redirect: S.common.optionalText,
});

export type StartGoogleOAuthDTO = z.infer<typeof StartGoogleOAuthSchema>;
