import { logger } from "@/lib/shared/infra/logger";
import { AppError } from "@/lib/shared/kernel/errors";
import type { ApiErrorResponse } from "@/lib/shared/kernel/response";

export function handleError(
  error: unknown,
  requestId: string,
): { status: number; body: ApiErrorResponse } {
  if (error instanceof AppError) {
    logger.warn(
      {
        err: error,
        code: error.code,
        details: error.details,
        requestId,
      },
      error.message,
    );

    return {
      status: error.httpStatus,
      body: {
        code: error.code,
        message: error.message,
        requestId,
        ...(error.details && { details: error.details }),
      },
    };
  }

  logger.error(
    {
      err: error,
      requestId,
    },
    "Unexpected error",
  );

  return {
    status: 500,
    body: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      requestId,
    },
  };
}
