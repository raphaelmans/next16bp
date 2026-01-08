import { NotFoundError, ValidationError } from "@/shared/kernel/errors";

export class ProfileNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super(`Profile not found: ${identifier}`);
  }
}

export class IncompleteProfileError extends ValidationError {
  readonly code = "INCOMPLETE_PROFILE";

  constructor() {
    super(
      "Please complete your profile before booking. A display name and at least one contact method (email or phone) is required.",
    );
  }
}
