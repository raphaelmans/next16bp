import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/shared/kernel/errors";

export * from "./place-photo.errors";

export class PlaceNotFoundError extends NotFoundError {
  readonly code = "PLACE_NOT_FOUND";

  constructor(placeId?: string) {
    super("Venue not found", placeId ? { placeId } : undefined);
  }
}

export class NotPlaceOwnerError extends AuthorizationError {
  readonly code = "NOT_PLACE_OWNER";

  constructor() {
    super("You are not the owner of this venue");
  }
}

export class PlaceSlugInvalidError extends ValidationError {
  readonly code = "PLACE_SLUG_INVALID";

  constructor(slug?: string) {
    super("Venue slug is invalid", slug ? { slug } : undefined);
  }
}

export class PlaceSlugTakenError extends ConflictError {
  readonly code = "PLACE_SLUG_TAKEN";

  constructor(slug: string) {
    super("Venue slug is already in use", { slug });
  }
}
