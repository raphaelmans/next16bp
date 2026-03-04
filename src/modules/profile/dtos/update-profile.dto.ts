import { z } from "zod";

const optionalTrimmedText = (maxLength: number) =>
  z
    .union([z.string(), z.undefined()])
    .transform((value) => {
      if (typeof value !== "string") {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    })
    .refine(
      (value) => value === undefined || value.length <= maxLength,
      `Must be at most ${maxLength} characters`,
    );

export const UpdateProfileSchema = z.object({
  displayName: optionalTrimmedText(100),
  email: z.string().email().optional(),
  phoneNumber: optionalTrimmedText(20),
  avatarUrl: z.string().url().optional(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
