import { z } from "zod";

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
