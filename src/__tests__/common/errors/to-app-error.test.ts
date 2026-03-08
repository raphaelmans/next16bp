import { describe, expect, it } from "vitest";
import { toAppError } from "@/common/errors/to-app-error";

const createTrpcLikeError = (data?: Record<string, unknown>) => {
  const error = new Error(
    "This time range overlaps an existing block.",
  ) as Error & {
    data?: Record<string, unknown>;
    shape?: { data?: Record<string, unknown> };
  };

  if (data) {
    error.data = data;
  }

  return error;
};

describe("toAppError", () => {
  it("treats 409 tRPC business-rule errors as validation errors", () => {
    const error = createTrpcLikeError({
      code: "COURT_BLOCK_OVERLAP",
      httpStatus: 409,
      requestId: "req-409",
    });

    expect(toAppError(error)).toEqual({
      kind: "validation",
      message: "This time range overlaps an existing block.",
      code: "COURT_BLOCK_OVERLAP",
      requestId: "req-409",
      fieldErrors: undefined,
      cause: error,
    });
  });

  it("falls back to shape.data when error.data is missing", () => {
    const error = createTrpcLikeError();
    error.shape = {
      data: {
        code: "COURT_BLOCK_OVERLAP",
        httpStatus: 409,
        requestId: "req-shape",
      },
    };

    expect(toAppError(error)).toEqual({
      kind: "validation",
      message: "This time range overlaps an existing block.",
      code: "COURT_BLOCK_OVERLAP",
      requestId: "req-shape",
      fieldErrors: undefined,
      cause: error,
    });
  });
});
