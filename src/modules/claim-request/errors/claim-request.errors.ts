import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/shared/kernel/errors";

export class ClaimRequestNotFoundError extends NotFoundError {
  readonly code = "CLAIM_REQUEST_NOT_FOUND";

  constructor(requestId?: string) {
    super("Claim request not found", requestId ? { requestId } : undefined);
  }
}

export class PlaceAlreadyClaimedError extends ConflictError {
  readonly code = "PLACE_ALREADY_CLAIMED";

  constructor(placeId: string) {
    super("This place has already been claimed", { placeId });
  }
}

export class PendingClaimExistsError extends ConflictError {
  readonly code = "PENDING_CLAIM_EXISTS";

  constructor(placeId: string) {
    super("A pending request already exists for this place", { placeId });
  }
}

export class NotCuratedPlaceError extends ValidationError {
  readonly code = "NOT_CURATED_PLACE";

  constructor(placeId: string) {
    super("Only curated places can be claimed", { placeId });
  }
}

export class PlaceNotUnclaimedError extends ValidationError {
  readonly code = "PLACE_NOT_UNCLAIMED";

  constructor(placeId: string) {
    super("This place is not available for claiming", { placeId });
  }
}

export class NotClaimRequestOwnerError extends AuthorizationError {
  readonly code = "NOT_CLAIM_REQUEST_OWNER";

  constructor() {
    super("You are not the owner of this claim request");
  }
}

export class InvalidClaimStatusError extends ValidationError {
  readonly code = "INVALID_CLAIM_STATUS";
}

export class NotOrganizationOwnerError extends AuthorizationError {
  readonly code = "NOT_ORGANIZATION_OWNER";

  constructor() {
    super("You are not the owner of this organization");
  }
}

export class OrganizationNotFoundError extends NotFoundError {
  readonly code = "ORGANIZATION_NOT_FOUND";

  constructor(organizationId?: string) {
    super(
      "Organization not found",
      organizationId ? { organizationId } : undefined,
    );
  }
}

export class PlaceNotFoundError extends NotFoundError {
  readonly code = "PLACE_NOT_FOUND";

  constructor(placeId?: string) {
    super("Place not found", placeId ? { placeId } : undefined);
  }
}
