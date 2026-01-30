import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/shared/kernel/errors";

export class CourtBlockNotFoundError extends NotFoundError {
  readonly code = "COURT_BLOCK_NOT_FOUND";

  constructor(blockId: string) {
    super("Court block not found.", { blockId });
  }
}

export class CourtBlockNotActiveError extends ValidationError {
  readonly code = "COURT_BLOCK_NOT_ACTIVE";

  constructor(blockId: string) {
    super("Court block is not active.", { blockId });
  }
}

export class CourtBlockNotWalkInError extends ValidationError {
  readonly code = "COURT_BLOCK_NOT_WALK_IN";

  constructor(blockId: string) {
    super("Court block must be a walk-in block.", { blockId });
  }
}

export class CourtBlockOverlapError extends ConflictError {
  readonly code = "COURT_BLOCK_OVERLAP";

  constructor(details?: Record<string, unknown>) {
    super("This time range overlaps an existing block.", details);
  }
}

export class CourtBlockOverlapsReservationError extends ConflictError {
  readonly code = "COURT_BLOCK_OVERLAPS_RESERVATION";

  constructor(details?: Record<string, unknown>) {
    super("This time range overlaps an existing reservation.", details);
  }
}

export class CourtBlockPricingUnavailableError extends BusinessRuleError {
  readonly code = "COURT_BLOCK_PRICING_UNAVAILABLE";

  constructor(details?: Record<string, unknown>) {
    super("Schedule pricing does not cover this time range.", details);
  }
}

export class CourtBlockDurationInvalidError extends ValidationError {
  readonly code = "COURT_BLOCK_DURATION_INVALID";

  constructor(details?: Record<string, unknown>) {
    super("Duration must be in 60-minute increments.", details);
  }
}

export class CourtBlockTimeRangeInvalidError extends ValidationError {
  readonly code = "COURT_BLOCK_TIME_RANGE_INVALID";

  constructor(details?: Record<string, unknown>) {
    super("End time must be after start time.", details);
  }
}
