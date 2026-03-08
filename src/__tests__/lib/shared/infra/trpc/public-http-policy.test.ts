import { describe, expect, it } from "vitest";
import {
  getTrpcProcedurePaths,
  shouldBlockAnonymousTrpcHttpRequest,
} from "@/lib/shared/infra/trpc/public-http-policy";

describe("public tRPC HTTP policy", () => {
  it("extracts batched procedure paths from the request URL", () => {
    const req = new Request(
      "https://example.com/api/trpc/place.listSummary,place.cardMetaByIds?batch=1",
    );

    expect(getTrpcProcedurePaths(req)).toEqual([
      "place.listSummary",
      "place.cardMetaByIds",
    ]);
  });

  it("blocks anonymous requests to server-only public procedures", () => {
    expect(
      shouldBlockAnonymousTrpcHttpRequest({
        isAuthenticated: false,
        procedurePaths: ["place.listSummary"],
      }),
    ).toBe(true);
  });

  it("allows authenticated requests to shared discovery procedures", () => {
    expect(
      shouldBlockAnonymousTrpcHttpRequest({
        isAuthenticated: true,
        procedurePaths: ["place.cardMetaByIds"],
      }),
    ).toBe(false);
  });

  it("allows anonymous requests to procedures that remain public", () => {
    expect(
      shouldBlockAnonymousTrpcHttpRequest({
        isAuthenticated: false,
        procedurePaths: ["availability.getForCourt"],
      }),
    ).toBe(false);
  });
});
