import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class CoachNotFoundError extends NotFoundError {
  readonly code = "COACH_NOT_FOUND";

  constructor(identifier: string) {
    super("Coach not found", { identifier });
  }
}

export class CoachAlreadyExistsError extends ConflictError {
  readonly code = "COACH_ALREADY_EXISTS";

  constructor(userId: string) {
    super("Coach profile already exists for this user", { userId });
  }
}

export class CoachSlugConflictError extends ConflictError {
  readonly code = "COACH_SLUG_CONFLICT";

  constructor(slug: string) {
    super("Coach slug is already taken", { slug });
  }
}

export class CoachNotActiveError extends BusinessRuleError {
  readonly code = "COACH_NOT_ACTIVE";

  constructor(coachId: string) {
    super("Coach is not active", { coachId });
  }
}
