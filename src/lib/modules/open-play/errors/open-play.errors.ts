import {
  AuthorizationError,
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class OpenPlayNotFoundError extends NotFoundError {
  constructor(openPlayId: string) {
    super(`Open Play not found: ${openPlayId}`, { openPlayId });
  }
}

export class OpenPlayReservationNotConfirmedError extends BusinessRuleError {
  constructor() {
    super("Open Play is not available until the reservation is confirmed.");
  }
}

export class OpenPlayNotActiveError extends BusinessRuleError {
  constructor(status: string) {
    super(`Open Play is not active (status: ${status}).`, { status });
  }
}

export class OpenPlayAlreadyExistsForReservationError extends ConflictError {
  constructor(reservationId: string, openPlayId: string) {
    super("An Open Play already exists for this reservation.", {
      reservationId,
      openPlayId,
    });
  }
}

export class OpenPlayNotHostError extends AuthorizationError {
  constructor() {
    super("Only the host can perform this action.");
  }
}

export class OpenPlayCannotJoinOwnError extends BusinessRuleError {
  constructor() {
    super("You cannot join your own Open Play.");
  }
}

export class OpenPlayAlreadyParticipatingError extends ConflictError {
  constructor(status: string) {
    super("You already have a join status for this Open Play.", { status });
  }
}

export class OpenPlayStartsInPastError extends BusinessRuleError {
  constructor() {
    super("This Open Play has already started.");
  }
}

export class OpenPlayCapacityReachedError extends BusinessRuleError {
  constructor(maxPlayers: number) {
    super("This Open Play is full.", { maxPlayers });
  }
}
