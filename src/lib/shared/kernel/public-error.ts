import type { AppError } from "./errors";

export const GENERIC_PUBLIC_ERROR_MESSAGE = "An unexpected error occurred";

const INTERNAL_ERROR_CODES = new Set([
  "INTERNAL_ERROR",
  "BAD_GATEWAY",
  "SERVICE_UNAVAILABLE",
  "GATEWAY_TIMEOUT",
]);

export const isInternalAppError = (error: AppError): boolean =>
  error.httpStatus >= 500 || INTERNAL_ERROR_CODES.has(error.code);

export const getPublicErrorMessage = (error: AppError): string =>
  isInternalAppError(error) ? GENERIC_PUBLIC_ERROR_MESSAGE : error.message;

export const canExposeErrorDetails = (error: AppError): boolean =>
  !isInternalAppError(error);
