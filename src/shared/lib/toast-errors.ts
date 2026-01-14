"use client";

import { useCallback } from "react";
import { toast } from "sonner";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getIssueMessage = (issues: unknown): string | null => {
  if (!Array.isArray(issues)) return null;
  if (issues.length === 0) return null;

  const firstIssue = issues[0];
  if (!isRecord(firstIssue)) return null;

  const message = firstIssue.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return null;
};

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

const getValidationMessage = (error: unknown): string | null => {
  if (!isRecord(error)) return null;

  const data = isRecord(error.data) ? error.data : null;
  if (!data) return null;

  const details = isRecord(data.details) ? data.details : null;
  const issueMessage = getIssueMessage(details?.issues);
  if (issueMessage) return issueMessage;

  const zodError = isRecord(data.zodError) ? data.zodError : null;
  const fieldErrorMessage = getFieldErrorMessage(zodError?.fieldErrors);
  if (fieldErrorMessage) return fieldErrorMessage;

  return null;
};

export const getClientErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
): string => {
  const validationMessage = getValidationMessage(error);
  if (validationMessage) return validationMessage;

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
