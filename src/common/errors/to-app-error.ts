import { toTrpcErrorMeta } from "./adapters/trpc";
import type { AppError } from "./app-error";

const mapErrorKind = (input: {
  status?: number;
  code?: string | null;
}): AppError["kind"] => {
  const code = input.code?.toUpperCase() ?? "";
  const status = input.status ?? 0;

  if (status === 401 || code.includes("UNAUTHORIZED")) return "unauthorized";
  if (status === 403 || code.includes("FORBIDDEN")) return "forbidden";
  if (status === 404 || code.includes("NOT_FOUND")) return "not_found";
  if (status === 429 || code.includes("TOO_MANY") || code.includes("RATE")) {
    return "rate_limited";
  }
  if (
    status === 422 ||
    code.includes("BAD_REQUEST") ||
    code.includes("PARSE") ||
    code.includes("VALIDATION")
  ) {
    return "validation";
  }
  if (status >= 500 || code.includes("NETWORK") || code.includes("TIMEOUT")) {
    return "network";
  }

  return "unknown";
};

export const toAppError = (err: unknown): AppError => {
  if (err instanceof Error) {
    const { status, code, requestId, zodFieldErrors } = toTrpcErrorMeta(err);
    const kind = mapErrorKind({ status, code });
    const message = err.message || "Unexpected error";

    if (kind === "validation") {
      return {
        kind,
        message,
        code,
        requestId,
        fieldErrors: zodFieldErrors,
        cause: err,
      };
    }

    if (
      kind === "unauthorized" ||
      kind === "forbidden" ||
      kind === "not_found" ||
      kind === "rate_limited"
    ) {
      return {
        kind,
        message,
        code,
        status,
        requestId,
        cause: err,
      };
    }

    if (kind === "network") {
      return {
        kind,
        message,
        status,
        code,
        requestId,
        cause: err,
      };
    }

    return {
      kind: "unknown",
      message,
      status,
      code,
      requestId,
      cause: err,
    };
  }

  return {
    kind: "unknown",
    message: "Unexpected error",
    cause: err,
  };
};
