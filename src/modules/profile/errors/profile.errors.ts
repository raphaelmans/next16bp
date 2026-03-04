import { NotFoundError } from "@/shared/kernel/errors";

export class ProfileNotFoundError extends NotFoundError {
  readonly code = "PROFILE_NOT_FOUND";

  constructor(userId: string) {
    super("Profile not found", { userId });
  }
}
