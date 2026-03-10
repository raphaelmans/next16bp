import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertUnavailabilityMock = vi.fn();
const deleteUnavailabilityMock = vi.fn();
const requireDeveloperApiKeyMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      upsertUnavailability: upsertUnavailabilityMock,
      deleteUnavailability: deleteUnavailabilityMock,
    }),
  }),
);

vi.mock("@/lib/shared/infra/auth/developer-api-key", () => ({
  requireDeveloperApiKey: (...args: unknown[]) =>
    requireDeveloperApiKeyMock(...args),
}));

vi.mock("@/lib/shared/infra/http/http-rate-limit", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/shared/infra/http/http-rate-limit")
  >("@/lib/shared/infra/http/http-rate-limit");

  return {
    ...actual,
    enforceRateLimit: (...args: unknown[]) => enforceRateLimitMock(...args),
  };
});

import {
  DELETE,
  PUT,
} from "@/app/api/developer/v1/courts/[externalCourtId]/unavailability/[externalWindowId]/route";

describe("Developer unavailability routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireDeveloperApiKeyMock.mockResolvedValue({
      organizationId: "org-1",
      integrationId: "integration-1",
      keyId: "key-1",
      scopes: ["availability.write"],
    });
    enforceRateLimitMock.mockResolvedValue({
      ok: true,
      rateLimit: {
        limit: 60,
        remaining: 59,
        reset: 1700000000000,
      },
    });
    upsertUnavailabilityMock.mockResolvedValue({
      externalCourtId: "ext-court-1",
      externalWindowId: "window-1",
      courtBlockId: "block-1",
      startTime: "2026-03-11T01:00:00.000Z",
      endTime: "2026-03-11T02:00:00.000Z",
      status: "ACTIVE",
      syncedAt: "2026-03-10T00:00:00.000Z",
    });
    deleteUnavailabilityMock.mockResolvedValue({
      success: true,
      externalCourtId: "ext-court-1",
      externalWindowId: "window-1",
      status: "CANCELED",
    });
  });

  it("PUT upserts a partner window and returns rate-limit headers", async () => {
    const req = new Request(
      "https://example.com/api/developer/v1/courts/ext-court-1/unavailability/window-1",
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-api-key": "kudos_live_demo_1234",
        },
        body: JSON.stringify({
          startTime: "2026-03-11T01:00:00.000Z",
          endTime: "2026-03-11T02:00:00.000Z",
          reason: "External sync",
        }),
      },
    );

    const response = await PUT(req, {
      params: Promise.resolve({
        externalCourtId: "ext-court-1",
        externalWindowId: "window-1",
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(upsertUnavailabilityMock).toHaveBeenCalledWith(
      expect.objectContaining({ keyId: "key-1" }),
      {
        externalCourtId: "ext-court-1",
        externalWindowId: "window-1",
        startTime: "2026-03-11T01:00:00.000Z",
        endTime: "2026-03-11T02:00:00.000Z",
        reason: "External sync",
      },
    );
    expect(body.data.status).toBe("ACTIVE");
    expect(response.headers.get("x-ratelimit-limit")).toBe("60");
  });

  it("DELETE is wrapped and idempotent-friendly", async () => {
    const req = new Request(
      "https://example.com/api/developer/v1/courts/ext-court-1/unavailability/window-1",
      {
        method: "DELETE",
        headers: {
          "x-api-key": "kudos_live_demo_1234",
        },
      },
    );

    const response = await DELETE(req, {
      params: Promise.resolve({
        externalCourtId: "ext-court-1",
        externalWindowId: "window-1",
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteUnavailabilityMock).toHaveBeenCalledWith(
      expect.objectContaining({ keyId: "key-1" }),
      {
        externalCourtId: "ext-court-1",
        externalWindowId: "window-1",
      },
    );
    expect(body).toEqual({
      data: {
        success: true,
        externalCourtId: "ext-court-1",
        externalWindowId: "window-1",
        status: "CANCELED",
      },
    });
  });
});
