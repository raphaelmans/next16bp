"use client";

import { useCallback } from "react";
import type { AppError } from "@/common/errors/app-error";
import { toAppError } from "@/common/errors/to-app-error";
import { toast } from "@/common/toast";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getFieldErrorMessage = (fieldErrors: unknown): string | null => {
  if (!isRecord(fieldErrors)) return null;

  for (const errorList of Object.values(fieldErrors)) {
    if (Array.isArray(errorList)) {
      const message = errorList.find(
        (entry) => typeof entry === "string" && entry.trim().length > 0,
      );
      if (message) return message;
    }
  }

  return null;
};

const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  AUTH_OTP_INVALID_OR_EXPIRED:
    "That code is expired or invalid. Tap \u201cResend code\u201d and use the latest email.",
  BOOKING_WINDOW_EXCEEDED:
    "This time is beyond the 60-day booking window. Choose an earlier date.",
  COURT_BLOCK_OVERLAP:
    "That time range overlaps another block. Choose a different time.",
  COURT_BLOCK_OVERLAPS_RESERVATION:
    "That time range overlaps an existing reservation.",
  COURT_BLOCK_PRICING_UNAVAILABLE:
    "Schedule pricing does not cover that time range. Update the schedule and try again.",
  COURT_BLOCK_DURATION_INVALID: "Duration must be in 60-minute increments.",
  COURT_BLOCK_TIME_RANGE_INVALID: "End time must be after start time.",
  RATE_LIMIT_EXCEEDED:
    "You can send up to 5 messages per minute. Please wait and try again.",
};

const INTERNAL_ERROR_CODES = new Set([
  "INTERNAL_ERROR",
  "BAD_GATEWAY",
  "SERVICE_UNAVAILABLE",
  "GATEWAY_TIMEOUT",
]);

const isInternalErrorCode = (code?: string): boolean => {
  if (typeof code !== "string") return false;
  const normalized = code.toUpperCase();
  return (
    INTERNAL_ERROR_CODES.has(normalized) ||
    normalized.includes("INTERNAL") ||
    normalized.includes("DATABASE")
  );
};

const shouldUseFallbackMessage = (appError: AppError): boolean => {
  if (appError.kind === "validation") return false;

  const code =
    appError.kind === "unauthorized" ||
    appError.kind === "forbidden" ||
    appError.kind === "not_found" ||
    appError.kind === "rate_limited" ||
    appError.kind === "network" ||
    appError.kind === "unknown"
      ? appError.code
      : undefined;

  const status =
    appError.kind === "unauthorized" ||
    appError.kind === "forbidden" ||
    appError.kind === "not_found" ||
    appError.kind === "rate_limited" ||
    appError.kind === "network" ||
    appError.kind === "unknown"
      ? appError.status
      : undefined;

  if (appError.kind === "unknown") return true;
  if (appError.kind === "network") return true;
  if (typeof status === "number" && status >= 500) return true;

  return isInternalErrorCode(code);
};

const getCodeErrorMessage = (error: unknown): string | null => {
  const appError = toAppError(error);
  const code =
    appError.kind === "validation" ||
    appError.kind === "unauthorized" ||
    appError.kind === "forbidden" ||
    appError.kind === "not_found" ||
    appError.kind === "rate_limited"
      ? appError.code
      : undefined;
  if (typeof code === "string" && code in FRIENDLY_ERROR_MESSAGES) {
    return FRIENDLY_ERROR_MESSAGES[code] ?? null;
  }

  return null;
};

const getValidationMessage = (error: unknown): string | null => {
  const appError = toAppError(error);
  if (appError.kind !== "validation") return null;

  const fieldErrorMessage = getFieldErrorMessage(
    appError.fieldErrors as unknown,
  );
  if (fieldErrorMessage) {
    return fieldErrorMessage;
  }

  const fallbackValidationMessage = appError.message;
  if (fallbackValidationMessage.trim().length > 0) {
    return fallbackValidationMessage;
  }

  return null;
};

export const getClientErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
): string => {
  const appError: AppError = toAppError(error);
  const codeMessage = getCodeErrorMessage(error);
  if (codeMessage) return codeMessage;

  const validationMessage = getValidationMessage(error);
  if (validationMessage) return validationMessage;

  if (shouldUseFallbackMessage(appError)) {
    return fallback;
  }

  if (appError.message.trim().length > 0) {
    return appError.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (isRecord(error)) {
    const message = error.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
};

interface CatchErrorToastOptions {
  successMessage?: string;
  errorTitle?: string;
  errorFallback?: string;
}

export const useCatchErrorToast = () =>
  useCallback(
    async <T>(
      callback: () => Promise<T> | T,
      options?: CatchErrorToastOptions,
    ): Promise<T | undefined> => {
      try {
        const result = await callback();
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        return result;
      } catch (error) {
        const description = getClientErrorMessage(
          error,
          options?.errorFallback ?? "Something went wrong",
        );
        toast.error(options?.errorTitle ?? "Request failed", {
          description,
        });
        return undefined;
      }
    },
    [],
  );
