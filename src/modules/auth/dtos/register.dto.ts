import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  redirect: z.string().trim().min(1).optional(),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;
