import { NotFoundError, ConflictError } from "@/shared/kernel/errors";

export class UserRoleNotFoundError extends NotFoundError {
  constructor(userId: string) {
    super("User role not found", { userId });
  }
}

export class UserRoleAlreadyExistsError extends ConflictError {
  constructor(userId: string) {
    super("User role already exists for this user", { userId });
  }
}
