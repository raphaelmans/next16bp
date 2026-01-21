import { AuthorizationError, NotFoundError } from "@/shared/kernel/errors";

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
