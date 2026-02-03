import {
  AuthenticationError,
  ConflictError,
  InternalError,
} from "@/lib/shared/kernel/errors";

export type AuthOtpType = "signup" | "email" | "magiclink" | "recovery";

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

export class AuthOtpInvalidOrExpiredError extends AuthenticationError {
  readonly code = "AUTH_OTP_INVALID_OR_EXPIRED";

  constructor(type: AuthOtpType) {
    super("Verification code expired or is invalid", { type });
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

export class AuthOAuthStartFailedError extends InternalError {
  readonly code = "AUTH_OAUTH_START_FAILED";

  constructor(provider: string) {
    super("Failed to start OAuth sign-in", { provider });
  }
}
