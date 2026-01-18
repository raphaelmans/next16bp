import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "@/shared/kernel/errors";

export class OrganizationNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super(`Organization not found: ${identifier}`);
  }
}

export class SlugAlreadyExistsError extends ConflictError {
  constructor(slug: string) {
    super(`Slug already exists: ${slug}`);
  }
}

export class UserAlreadyHasOrganizationError extends ConflictError {
  constructor() {
    super("You already have an organization");
  }
}

export class NotOrganizationOwnerError extends AuthorizationError {
  constructor() {
    super("You are not the owner of this organization");
  }
}
