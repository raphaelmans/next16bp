import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;
