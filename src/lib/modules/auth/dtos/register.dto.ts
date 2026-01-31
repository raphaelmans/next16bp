import { z } from "zod";
import { S } from "@/common/schemas";

export const RegisterSchema = z.object({
  email: S.auth.email,
  password: S.auth.password,
  redirect: S.common.optionalText,
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;
