import { describe, expect, it } from "vitest";
import {
  LIVE_PREFETCH_QUERY_OPTIONS,
  LIVE_QUERY_OPTIONS,
  shouldRetryLiveQuery,
} from "@/common/live-query-options";

describe("live-query-options", () => {
  it("disables reconnect refetches for live queries and prefetch retries", () => {
    expect(LIVE_QUERY_OPTIONS.refetchOnReconnect).toBe(false);
    expect(LIVE_PREFETCH_QUERY_OPTIONS.retry).toBe(false);
    expect(LIVE_PREFETCH_QUERY_OPTIONS.staleTime).toBe(30_000);
  });

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
