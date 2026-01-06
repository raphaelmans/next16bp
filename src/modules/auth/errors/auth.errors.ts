import {
  AuthenticationError,
  ConflictError,
  InternalError,
} from "@/shared/kernel/errors";

export class InvalidCredentialsError extends AuthenticationError {
  readonly code = "AUTH_INVALID_CREDENTIALS";

  constructor() {
    super("Invalid email or password");
  }
}

export class EmailNotVerifiedError extends AuthenticationError {
  readonly code = "AUTH_EMAIL_NOT_VERIFIED";

  constructor(email: string) {
    super("Email not verified", { email });
  }
}

export class UserAlreadyExistsError extends ConflictError {
  readonly code = "AUTH_USER_ALREADY_EXISTS";

  constructor(email: string) {
    super("User already exists", { email });
  }
}

export class SessionExpiredError extends AuthenticationError {
  readonly code = "AUTH_SESSION_EXPIRED";

  constructor() {
    super("Session expired, please login again");
  }
}

export class AuthRegistrationFailedError extends InternalError {
  readonly code = "AUTH_REGISTRATION_FAILED";

  constructor(email: string) {
    super("Failed to complete registration", { email });
  }
}
