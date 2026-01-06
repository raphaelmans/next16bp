/**
 * Base error class for all application errors.
 * Provides structured error handling with HTTP status mapping.
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 - Bad Request
export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
  readonly httpStatus = 400;
}

// 401 - Unauthorized
export class AuthenticationError extends AppError {
  readonly code = "AUTHENTICATION_ERROR";
  readonly httpStatus = 401;
}

// 403 - Forbidden
export class AuthorizationError extends AppError {
  readonly code = "AUTHORIZATION_ERROR";
  readonly httpStatus = 403;
}

// 404 - Not Found
export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND";
  readonly httpStatus = 404;
}

// 409 - Conflict
export class ConflictError extends AppError {
  readonly code = "CONFLICT";
  readonly httpStatus = 409;
}

// 422 - Unprocessable Entity (business rule violations)
export class BusinessRuleError extends AppError {
  readonly code = "BUSINESS_RULE_VIOLATION";
  readonly httpStatus = 422;
}

// 429 - Too Many Requests
export class RateLimitError extends AppError {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly httpStatus = 429;
}

// 500 - Internal Server Error
export class InternalError extends AppError {
  readonly code = "INTERNAL_ERROR";
  readonly httpStatus = 500;
}

// 502 - Bad Gateway
export class BadGatewayError extends AppError {
  readonly code = "BAD_GATEWAY";
  readonly httpStatus = 502;
}

// 503 - Service Unavailable
export class ServiceUnavailableError extends AppError {
  readonly code = "SERVICE_UNAVAILABLE";
  readonly httpStatus = 503;
}

// 504 - Gateway Timeout
export class GatewayTimeoutError extends AppError {
  readonly code = "GATEWAY_TIMEOUT";
  readonly httpStatus = 504;
}
