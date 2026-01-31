import { z } from "zod";
import { S } from "@/common/schemas";

export const UpdateProfileSchema = z.object({
  displayName: S.profile.displayName.optional(),
  email: S.common.email.optional(),
  phoneNumber: S.profile.phoneNumber,
  avatarUrl: S.profile.avatarUrl.optional(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
