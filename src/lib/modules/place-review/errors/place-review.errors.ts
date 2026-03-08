import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class PlaceReviewNotFoundError extends NotFoundError {
  readonly code = "PLACE_REVIEW_NOT_FOUND";

  constructor(reviewId?: string) {
    super("Review not found", reviewId ? { reviewId } : undefined);
  }
}

export class PlaceReviewAlreadyRemovedError extends BusinessRuleError {
  readonly code = "PLACE_REVIEW_ALREADY_REMOVED";

  constructor(reviewId: string) {
    super("Review has already been removed", { reviewId });
  }
}

export class PlaceReviewNotAuthorError extends AuthorizationError {
  readonly code = "PLACE_REVIEW_NOT_AUTHOR";

  constructor() {
    super("You are not the author of this review");
  }
}
