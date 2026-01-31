import { z } from "zod";
import { S } from "@/common/schemas";

export const StartGoogleOAuthSchema = z.object({
  redirect: S.common.optionalText,
});

export type StartGoogleOAuthDTO = z.infer<typeof StartGoogleOAuthSchema>;
