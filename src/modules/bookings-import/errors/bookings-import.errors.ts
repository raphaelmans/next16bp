import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/shared/kernel/errors";

export class BookingsImportPlaceNotFoundError extends NotFoundError {
  readonly code = "BOOKINGS_IMPORT_PLACE_NOT_FOUND";

  constructor(placeId: string) {
    super("Venue not found", { placeId });
  }
}

export class BookingsImportNotOwnerError extends AuthorizationError {
  readonly code = "BOOKINGS_IMPORT_NOT_OWNER";

  constructor() {
    super("You do not have access to this venue");
  }
}

export class BookingsImportInvalidSourceError extends ValidationError {
  readonly code = "BOOKINGS_IMPORT_INVALID_SOURCE";

  constructor(sourceType: string) {
    super("Unsupported import source", { sourceType });
  }
}

export class BookingsImportInvalidFileTypeError extends ValidationError {
  readonly code = "BOOKINGS_IMPORT_INVALID_FILE_TYPE";

  constructor(fileType: string, allowedTypes: string[]) {
    super("Invalid file type for this source", { fileType, allowedTypes });
  }
}

export class BookingsImportJobNotFoundError extends NotFoundError {
  readonly code = "BOOKINGS_IMPORT_JOB_NOT_FOUND";

  constructor(jobId: string) {
    super("Import job not found", { jobId });
  }
}

export class BookingsImportRowNotFoundError extends NotFoundError {
  readonly code = "BOOKINGS_IMPORT_ROW_NOT_FOUND";

  constructor(rowId: string) {
    super("Import row not found", { rowId });
  }
}

export class BookingsImportInvalidStatusError extends ValidationError {
  readonly code = "BOOKINGS_IMPORT_INVALID_STATUS";

  constructor(currentStatus: string, expectedStatuses: string[]) {
    super("Import job is not in the expected status", {
      currentStatus,
      expectedStatuses,
    });
  }
}

export class BookingsImportAiRequiredError extends ValidationError {
  readonly code = "BOOKINGS_IMPORT_AI_REQUIRED";

  constructor(sourceType: string) {
    super("AI normalization is required for this import source", {
      sourceType,
    });
  }
}

export class BookingsImportAiNotConfiguredError extends ValidationError {
  readonly code = "BOOKINGS_IMPORT_AI_NOT_CONFIGURED";

  constructor() {
    super("AI normalization is not configured", {
      missing: "OPENAI_API_KEY",
    });
  }
}

export class BookingsImportAiAlreadyUsedError extends ValidationError {
  readonly code = "BOOKINGS_IMPORT_AI_ALREADY_USED";

  constructor(placeId: string, usedAt: string) {
    super("AI normalization has already been used for this venue", {
      placeId,
      usedAt,
    });
  }
}

export class BookingsImportHasBlockingErrorsError extends ValidationError {
  readonly code = "BOOKINGS_IMPORT_HAS_BLOCKING_ERRORS";

  constructor(errorCount: number) {
    super("Import has rows with blocking errors that must be fixed", {
      errorCount,
    });
  }
}
