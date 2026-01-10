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

export class CourtAlreadyClaimedError extends ConflictError {
  readonly code = "COURT_ALREADY_CLAIMED";

  constructor(courtId: string) {
    super("This court has already been claimed", { courtId });
  }
}

export class PendingClaimExistsError extends ConflictError {
  readonly code = "PENDING_CLAIM_EXISTS";

  constructor(courtId: string) {
    super("A pending claim request already exists for this court", { courtId });
  }
}

export class NotCuratedCourtError extends ValidationError {
  readonly code = "NOT_CURATED_COURT";

  constructor(courtId: string) {
    super("Only curated courts can be claimed", { courtId });
  }
}

export class CourtNotUnclaimedError extends ValidationError {
  readonly code = "COURT_NOT_UNCLAIMED";

  constructor(courtId: string) {
    super("This court is not available for claiming", { courtId });
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

export class CourtNotFoundError extends NotFoundError {
  readonly code = "COURT_NOT_FOUND";

  constructor(courtId?: string) {
    super("Court not found", courtId ? { courtId } : undefined);
  }
}
