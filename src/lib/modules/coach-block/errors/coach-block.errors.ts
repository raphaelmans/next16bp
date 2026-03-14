import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class CoachBlockNotFoundError extends NotFoundError {
  readonly code = "COACH_BLOCK_NOT_FOUND";

  constructor(blockId: string) {
    super("Coach block not found", { blockId });
  }
}

export class CoachBlockOverlapError extends ConflictError {
  readonly code = "COACH_BLOCK_OVERLAP";

  constructor(coachId: string, details?: Record<string, unknown>) {
    super("Coach block overlaps an existing block", { coachId, ...details });
  }
}

export class CoachBlockTimeRangeInvalidError extends BusinessRuleError {
  readonly code = "COACH_BLOCK_TIME_RANGE_INVALID";

  constructor(details?: Record<string, unknown>) {
    super("Coach block time range is invalid", details);
  }
}
