import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/shared/kernel/errors";

export class ReservationNotFoundError extends NotFoundError {
  readonly code = "RESERVATION_NOT_FOUND";

  constructor(reservationId?: string) {
    super(
      "Reservation not found",
      reservationId ? { reservationId } : undefined,
    );
  }
}

export class SlotNotAvailableError extends ValidationError {
  readonly code = "SLOT_NOT_AVAILABLE";

  constructor(slotId: string, status: string) {
    super(`Time slot is not available for booking (status: ${status})`, {
      slotId,
      status,
    });
  }
}

export class ReservationExpiredError extends ValidationError {
  readonly code = "RESERVATION_EXPIRED";

  constructor(reservationId: string) {
    super("Reservation has expired", { reservationId });
  }
}

export class InvalidReservationStatusError extends ValidationError {
  readonly code = "INVALID_RESERVATION_STATUS";

  constructor(
    reservationId: string,
    currentStatus: string,
    expectedStatuses: string[],
  ) {
    super(
      `Invalid reservation status: expected ${expectedStatuses.join(" or ")}, got ${currentStatus}`,
      { reservationId, currentStatus, expectedStatuses },
    );
  }
}

export class NotReservationOwnerError extends AuthorizationError {
  readonly code = "NOT_RESERVATION_OWNER";

  constructor() {
    super("You are not the owner of this reservation");
  }
}

export class TermsNotAcceptedError extends ValidationError {
  readonly code = "TERMS_NOT_ACCEPTED";

  constructor() {
    super("Terms must be accepted to complete the reservation");
  }
}
