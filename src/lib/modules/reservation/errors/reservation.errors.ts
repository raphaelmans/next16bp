import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/shared/kernel/errors";

export class ReservationNotFoundError extends NotFoundError {
  readonly code = "RESERVATION_NOT_FOUND";

  constructor(reservationId?: string) {
    super(
      "Reservation not found",
      reservationId ? { reservationId } : undefined,
    );
  }
}

export class ReservationGroupNotFoundError extends NotFoundError {
  readonly code = "RESERVATION_GROUP_NOT_FOUND";

  constructor(reservationGroupId?: string) {
    super(
      "Reservation group not found",
      reservationGroupId ? { reservationGroupId } : undefined,
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

export class NoAvailabilityError extends ValidationError {
  readonly code = "NO_AVAILABILITY";

  constructor(details?: {
    courtId?: string;
    placeId?: string;
    sportId?: string;
    startTime?: string;
    durationMinutes?: number;
  }) {
    super("No availability for the selected time", details);
  }
}

export class ReservationCancellationWindowError extends ValidationError {
  readonly code = "RESERVATION_CANCELLATION_WINDOW_PASSED";

  constructor(reservationId: string, cutoffMinutes: number, cutoffTime: Date) {
    super("Reservation can no longer be cancelled", {
      reservationId,
      cutoffMinutes,
      cutoffTime: cutoffTime.toISOString(),
    });
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

export class ReservationTimeRangeInvalidError extends ValidationError {
  readonly code = "RESERVATION_TIME_RANGE_INVALID";

  constructor(details?: Record<string, unknown>) {
    super("End time must be after start time.", details);
  }
}

export class ReservationDurationInvalidError extends ValidationError {
  readonly code = "RESERVATION_DURATION_INVALID";

  constructor(details?: Record<string, unknown>) {
    super("Duration must be in 60-minute increments.", details);
  }
}

export class ReservationPricingUnavailableError extends ValidationError {
  readonly code = "RESERVATION_PRICING_UNAVAILABLE";

  constructor(details?: Record<string, unknown>) {
    super("Schedule pricing does not cover this time range.", details);
  }
}

export class ReservationPaymentNotRequiredError extends ValidationError {
  readonly code = "RESERVATION_PAYMENT_NOT_REQUIRED";

  constructor(details?: Record<string, unknown>) {
    super("Reservation does not require payment.", details);
  }
}

export class ReservationPaymentMethodInvalidError extends ValidationError {
  readonly code = "RESERVATION_PAYMENT_METHOD_INVALID";

  constructor(details?: Record<string, unknown>) {
    super(
      "Selected payment method is invalid or does not belong to this organization.",
      details,
    );
  }
}

export class BookingWindowExceededError extends ValidationError {
  readonly code = "BOOKING_WINDOW_EXCEEDED";

  constructor(startTime: Date, maxStartTime: Date) {
    super("Start time is beyond the maximum booking window", {
      startTime: startTime.toISOString(),
      maxStartTime: maxStartTime.toISOString(),
    });
  }
}

export class ReservationStartTimeInPastError extends ValidationError {
  readonly code = "RESERVATION_START_TIME_IN_PAST";

  constructor(startTime: Date, now: Date) {
    super("Start time must be in the future", {
      startTime: startTime.toISOString(),
      now: now.toISOString(),
    });
  }
}

export class ReservationGroupInvalidError extends ValidationError {
  readonly code = "RESERVATION_GROUP_INVALID";
}
