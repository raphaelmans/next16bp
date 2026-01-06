import { AuthenticationError, ConflictError } from "@/shared/kernel/errors";

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super("Invalid email or password");
  }
}

export class EmailNotVerifiedError extends AuthenticationError {
  constructor(email: string) {
    super("Email not verified", { email });
  }
}

export class UserAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super("User already exists", { email });
  }
}

export class SessionExpiredError extends AuthenticationError {
  constructor() {
    super("Session expired, please login again");
  }
}
