import { z } from "zod";
import { allowEmptyString, S } from "@/shared/kernel/schemas";

export const profileSchema = z.object({
  displayName: S.profile.displayName,
  email: allowEmptyString(S.common.email.optional()),
  phoneNumber: allowEmptyString(S.profile.phoneNumber),
  avatarUrl: allowEmptyString(S.profile.avatarUrl.optional()),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
