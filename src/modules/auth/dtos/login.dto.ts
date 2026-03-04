import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

export const MagicLinkSchema = z.object({
  email: z.string().email(),
  redirect: z.string().trim().min(1).optional(),
});

export type MagicLinkDTO = z.infer<typeof MagicLinkSchema>;
