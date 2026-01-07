import {
  ConflictError,
  NotFoundError,
  AuthorizationError,
  ValidationError,
} from "@/shared/kernel/errors";

export class PaymentProofAlreadyExistsError extends ConflictError {
  readonly code = "PAYMENT_PROOF_ALREADY_EXISTS";

  constructor(reservationId: string) {
    super("Payment proof already exists for this reservation", {
      reservationId,
    });
  }
}

export class PaymentProofNotFoundError extends NotFoundError {
  readonly code = "PAYMENT_PROOF_NOT_FOUND";

  constructor(reservationId?: string) {
    super(
      "Payment proof not found",
      reservationId ? { reservationId } : undefined,
    );
  }
}

export class NotReservationOwnerError extends AuthorizationError {
  readonly code = "NOT_RESERVATION_OWNER";

  constructor() {
    super("You are not the owner of this reservation");
  }
}

export class InvalidReservationStatusError extends ValidationError {
  readonly code = "INVALID_RESERVATION_STATUS";

  constructor(message: string) {
    super(message);
  }
}

export class ReservationNotFoundError extends NotFoundError {
  readonly code = "RESERVATION_NOT_FOUND";

  constructor(reservationId?: string) {
    super(
      "Reservation not found",
      reservationId ? { reservationId } : undefined,
    );
  }
}
