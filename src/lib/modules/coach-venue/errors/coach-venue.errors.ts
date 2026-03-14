import {
  AuthorizationError,
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class CoachVenueNotFoundError extends NotFoundError {
  readonly code = "COACH_VENUE_NOT_FOUND";

  constructor(identifier: string) {
    super("Coach venue link not found", { identifier });
  }
}

export class CoachVenueAlreadyLinkedError extends ConflictError {
  readonly code = "COACH_VENUE_ALREADY_LINKED";

  constructor(coachId: string, placeId: string) {
    super("Coach already has a pending or accepted link to this venue", {
      coachId,
      placeId,
    });
  }
}

export class CoachVenueInvalidStatusError extends BusinessRuleError {
  readonly code = "COACH_VENUE_INVALID_STATUS";

  constructor(
    currentStatus: string,
    expectedStatus: string,
    coachVenueId: string,
  ) {
    super(
      `Cannot transition from ${currentStatus}; expected ${expectedStatus}`,
      { currentStatus, expectedStatus, coachVenueId },
    );
  }
}

export class CoachVenueNotOwnerError extends AuthorizationError {
  readonly code = "COACH_VENUE_NOT_OWNER";

  constructor() {
    super("You are not the owner of this venue");
  }
}

export class CoachVenueNotCoachError extends AuthorizationError {
  readonly code = "COACH_VENUE_NOT_COACH";

  constructor() {
    super("You are not the coach associated with this venue link");
  }
}
