import {
  NotFoundError,
  ConflictError,
  AuthorizationError,
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

export class NotOrganizationOwnerError extends AuthorizationError {
  constructor() {
    super("You are not the owner of this organization");
  }
}
