import { describe, expect, it } from "vitest";
import { getClientErrorMessage } from "@/common/toast/errors";

const createTrpcLikeError = () => {
  const error = new Error(
    "This time range overlaps an existing block.",
  ) as Error & {
    data?: Record<string, unknown>;
  };

  error.data = {
    code: "COURT_BLOCK_OVERLAP",
    httpStatus: 409,
    requestId: "req-toast",
  };

  return error;
};

describe("getClientErrorMessage", () => {
  it("returns the friendly message for expected 409 tRPC errors", () => {
    expect(
      getClientErrorMessage(createTrpcLikeError(), "Please try again"),
    ).toBe("That time range overlaps another block. Choose a different time.");
  });

  it("reads normalized string field errors", () => {
    expect(
      getClientErrorMessage(
        {
          kind: "validation",
          message: "Validation failed",
          fieldErrors: {
            reason: "Reason is required",
          },
        },
        "Please try again",
      ),
    ).toBe("Reason is required");
  });
});
