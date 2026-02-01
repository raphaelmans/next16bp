import { z } from "zod";
import { S } from "@/common/schemas";

export const RequestEmailOtpSchema = z.object({
  email: S.auth.email,
  redirect: S.common.optionalText,
});

export type RequestEmailOtpDTO = z.infer<typeof RequestEmailOtpSchema>;

export const VerifyEmailOtpSchema = z.object({
  email: S.auth.email,
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { error: "Enter the 6-digit code" }),
  redirect: S.common.optionalText,
});

export type VerifyEmailOtpDTO = z.infer<typeof VerifyEmailOtpSchema>;
