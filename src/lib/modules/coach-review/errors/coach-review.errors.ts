import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class CoachReviewNotFoundError extends NotFoundError {
  readonly code = "COACH_REVIEW_NOT_FOUND";

  constructor(reviewId?: string) {
    super("Review not found", reviewId ? { reviewId } : undefined);
  }
}

export class CoachReviewAlreadyRemovedError extends BusinessRuleError {
  readonly code = "COACH_REVIEW_ALREADY_REMOVED";

  constructor(reviewId: string) {
    super("Review has already been removed", { reviewId });
  }
}

export class CoachReviewNotAuthorError extends AuthorizationError {
  readonly code = "COACH_REVIEW_NOT_AUTHOR";

  constructor() {
    super("You are not the author of this review");
  }
}

export class CoachReviewNotEligibleError extends BusinessRuleError {
  readonly code = "COACH_REVIEW_NOT_ELIGIBLE";

  constructor(coachId: string) {
    super(
      "Only players with a completed confirmed session can review this coach",
      { coachId },
    );
  }
}
