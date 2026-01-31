import { NotFoundError } from "@/lib/shared/kernel/errors";

export class GuestProfileNotFoundError extends NotFoundError {
  readonly code = "GUEST_PROFILE_NOT_FOUND";

  constructor(guestProfileId?: string) {
    super(
      "Guest profile not found",
      guestProfileId ? { guestProfileId } : undefined,
    );
  }
}
