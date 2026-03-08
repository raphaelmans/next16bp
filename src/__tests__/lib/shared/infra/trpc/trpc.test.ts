import { describe, expect, it } from "vitest";
import { pickPublicTrpcShapeData } from "@/lib/shared/infra/trpc/trpc";

describe("pickPublicTrpcShapeData", () => {
  it("keeps only explicit safe shape fields", () => {
    const zodError = {
      fieldErrors: {
        reason: ["Reason is required"],
      },
    };

    expect(
      pickPublicTrpcShapeData({
        path: "courtBlock.createMaintenance",
        stack: "secret stack trace",
        zodError,
      }),
    ).toEqual({
      path: "courtBlock.createMaintenance",
      zodError,
    });
  });
});
