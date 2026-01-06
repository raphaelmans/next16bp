import { NotFoundError, ConflictError } from "@/shared/kernel/errors";

export class UserRoleNotFoundError extends NotFoundError {
  readonly code = "USER_ROLE_NOT_FOUND";

  constructor(userId: string) {
    super("User role not found", { userId });
  }
}

export class UserRoleAlreadyExistsError extends ConflictError {
  readonly code = "USER_ROLE_ALREADY_EXISTS";

  constructor(userId: string) {
    super("User role already exists for this user", { userId });
  }
}
