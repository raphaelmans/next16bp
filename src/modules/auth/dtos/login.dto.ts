import { z } from "zod";
import { S } from "@/shared/kernel/schemas";

export const LoginSchema = z.object({
  email: S.auth.email,
  password: S.auth.loginPassword,
});

export type LoginDTO = z.infer<typeof LoginSchema>;

export const MagicLinkSchema = z.object({
  email: S.auth.email,
  redirect: S.common.optionalText,
});

export type MagicLinkDTO = z.infer<typeof MagicLinkSchema>;
