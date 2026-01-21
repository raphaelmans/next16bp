import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/shared/kernel/errors";

export class PlaceVerificationRequestNotFoundError extends NotFoundError {
  readonly code = "PLACE_VERIFICATION_REQUEST_NOT_FOUND";

  constructor(requestId?: string) {
    super(
      "Venue verification request not found",
      requestId ? { requestId } : undefined,
    );
  }
}

export class PlaceVerificationNotFoundError extends NotFoundError {
  readonly code = "PLACE_VERIFICATION_NOT_FOUND";

  constructor(placeId?: string) {
    super("Venue verification not found", placeId ? { placeId } : undefined);
  }
}

export class PlaceVerificationAlreadyPendingError extends ConflictError {
  readonly code = "PLACE_VERIFICATION_ALREADY_PENDING";

  constructor(placeId: string) {
    super("A pending verification request already exists", { placeId });
  }
}

export class PlaceVerificationAlreadyReviewedError extends ConflictError {
  readonly code = "PLACE_VERIFICATION_ALREADY_REVIEWED";

  constructor(status: string) {
    super("Verification request already reviewed", { status });
  }
}

export class NotPlaceOwnerError extends AuthorizationError {
  readonly code = "NOT_PLACE_OWNER";

  constructor() {
    super("You are not the owner of this venue");
  }
}

export class PlaceVerificationDocumentsRequiredError extends ValidationError {
  readonly code = "PLACE_VERIFICATION_DOCUMENTS_REQUIRED";

  constructor() {
    super("At least one verification document is required");
  }
}

export class PlaceNotBookableError extends ValidationError {
  readonly code = "PLACE_NOT_BOOKABLE";

  constructor(placeId: string) {
    super("Reservations are not enabled for this venue", { placeId });
  }
}
