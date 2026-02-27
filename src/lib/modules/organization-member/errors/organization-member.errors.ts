import {
  AuthorizationError,
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class OrganizationMemberPermissionDeniedError extends AuthorizationError {
  constructor(permission: string, details?: Record<string, unknown>) {
    super(`Missing required organization permission: ${permission}`, {
      permission,
      ...details,
    });
  }
}

export class OrganizationMemberNotFoundError extends NotFoundError {
  constructor(details?: Record<string, unknown>) {
    super("Organization member not found", details);
  }
}

export class OrganizationInvitationNotFoundError extends NotFoundError {
  constructor(details?: Record<string, unknown>) {
    super("Organization invitation not found", details);
  }
}

export class OrganizationInvitationExpiredError extends BusinessRuleError {
  constructor(details?: Record<string, unknown>) {
    super("Organization invitation has expired", details);
  }
}

export class OrganizationInvitationEmailMismatchError extends AuthorizationError {
  constructor(details?: Record<string, unknown>) {
    super("Invitation email does not match authenticated user", details);
  }
}

export class OrganizationInvitationAlreadyResolvedError extends ConflictError {
  constructor(details?: Record<string, unknown>) {
    super("Organization invitation is no longer pending", details);
  }
}

export class OrganizationMemberAlreadyExistsError extends ConflictError {
  constructor(details?: Record<string, unknown>) {
    super("Organization member already exists", details);
  }
}
