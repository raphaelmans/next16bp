export type AppErrorKind =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "validation"
  | "unknown";

export type AppError =
  | {
      kind: "network";
      message: string;
      cause?: unknown;
    }
  | {
      kind: "unauthorized" | "forbidden" | "not_found" | "rate_limited";
      message: string;
      status?: number;
      code?: string;
      requestId?: string;
      cause?: unknown;
    }
  | {
      kind: "validation";
      message: string;
      fieldErrors?: Record<string, string>;
      code?: string;
      requestId?: string;
      cause?: unknown;
    }
  | {
      kind: "unknown";
      message: string;
      cause?: unknown;
    };
