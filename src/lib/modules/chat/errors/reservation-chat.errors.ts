import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class ReservationChatNotAvailableError extends AuthorizationError {
  readonly code = "RESERVATION_CHAT_NOT_AVAILABLE";

  constructor(status: string) {
    super("Reservation chat is not available yet", { status });
  }
}

export class ReservationChatNotParticipantError extends AuthorizationError {
  readonly code = "RESERVATION_CHAT_NOT_PARTICIPANT";

  constructor(reservationId: string) {
    super("You are not a participant in this reservation chat", {
      reservationId,
    });
  }
}

export class ReservationChatGuestReservationNotSupportedError extends BusinessRuleError {
  readonly code = "RESERVATION_CHAT_GUEST_NOT_SUPPORTED";

  constructor(reservationId: string) {
    super("Reservation chat is not supported for guest bookings", {
      reservationId,
    });
  }
}

export class ReservationChatThreadNotFoundError extends NotFoundError {
  readonly code = "RESERVATION_CHAT_THREAD_NOT_FOUND";

  constructor(reservationId: string) {
    super("Reservation chat thread not found", { reservationId });
  }
}
