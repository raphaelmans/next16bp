import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/shared/kernel/errors";

export class SlotNotFoundError extends NotFoundError {
  readonly code = "SLOT_NOT_FOUND";

  constructor(slotId?: string) {
    super("Time slot not found", slotId ? { slotId } : undefined);
  }
}

export class SlotOverlapError extends ConflictError {
  readonly code = "SLOT_OVERLAP";

  constructor(courtId: string, startTime: Date, endTime: Date) {
    super("Time slot overlaps with an existing slot", {
      courtId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  }
}

export class SlotNotAvailableError extends ValidationError {
  readonly code = "SLOT_NOT_AVAILABLE";

  constructor(slotId: string, currentStatus: string) {
    super(`Time slot is not available (status: ${currentStatus})`, {
      slotId,
      currentStatus,
    });
  }
}

export class InvalidSlotDurationError extends ValidationError {
  readonly code = "INVALID_SLOT_DURATION";

  constructor(message: string = "End time must be after start time") {
    super(message);
  }
}

export class CourtNotReservableError extends ValidationError {
  readonly code = "COURT_NOT_RESERVABLE";

  constructor(courtId: string) {
    super("Court is not reservable - cannot create time slots", { courtId });
  }
}

export class SlotInUseError extends ValidationError {
  readonly code = "SLOT_IN_USE";

  constructor(slotId: string, status: string) {
    super(`Cannot modify slot that is ${status}`, { slotId, status });
  }
}
