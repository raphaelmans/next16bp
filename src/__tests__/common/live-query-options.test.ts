import { describe, expect, it } from "vitest";
import { shouldRetryLiveQuery } from "@/common/live-query-options";

describe("live-query-options", () => {
  it("does not retry rate-limited queries", () => {
    expect(
      shouldRetryLiveQuery(0, {
        kind: "rate_limited",
        message: "Too many requests",
      }),
    ).toBe(false);
  });

  it("retries network queries only once", () => {
    expect(
      shouldRetryLiveQuery(0, {
        kind: "network",
        message: "Network error",
      }),
    ).toBe(true);
    expect(
      shouldRetryLiveQuery(1, {
        kind: "network",
        message: "Network error",
      }),
    ).toBe(false);
  });
});
