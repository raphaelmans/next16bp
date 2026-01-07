import {
  NotFoundError,
  AuthorizationError,
  ValidationError,
  ConflictError,
} from "@/shared/kernel/errors";

export class CourtNotFoundError extends NotFoundError {
  readonly code = "COURT_NOT_FOUND";

  constructor(courtId?: string) {
    super("Court not found", courtId ? { courtId } : undefined);
  }
}

export class NotCourtOwnerError extends AuthorizationError {
  readonly code = "NOT_COURT_OWNER";

  constructor() {
    super("You are not the owner of this court");
  }
}

export class InvalidCourtTypeError extends ValidationError {
  readonly code = "INVALID_COURT_TYPE";

  constructor(expected: string, actual: string) {
    super(`Invalid court type: expected ${expected}, got ${actual}`, {
      expected,
      actual,
    });
  }
}

export class DuplicateAmenityError extends ConflictError {
  readonly code = "DUPLICATE_AMENITY";

  constructor(courtId: string, amenityName: string) {
    super(`Amenity "${amenityName}" already exists for this court`, {
      courtId,
      amenityName,
    });
  }
}

export class MaxPhotosExceededError extends ValidationError {
  readonly code = "MAX_PHOTOS_EXCEEDED";

  constructor(maxPhotos: number = 10) {
    super(`Maximum number of photos (${maxPhotos}) exceeded`, { maxPhotos });
  }
}

export class PhotoNotFoundError extends NotFoundError {
  readonly code = "PHOTO_NOT_FOUND";

  constructor(photoId: string) {
    super("Photo not found", { photoId });
  }
}

export class AmenityNotFoundError extends NotFoundError {
  readonly code = "AMENITY_NOT_FOUND";

  constructor(amenityId: string) {
    super("Amenity not found", { amenityId });
  }
}

export class CourtNotReservableError extends ValidationError {
  readonly code = "COURT_NOT_RESERVABLE";

  constructor(courtId: string) {
    super("Court is not reservable", { courtId });
  }
}
