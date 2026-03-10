import { beforeEach, describe, expect, it, vi } from "vitest";

const getAvailabilityMock = vi.fn();
const requireDeveloperApiKeyMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      getAvailability: getAvailabilityMock,
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

import { GET } from "@/app/api/developer/v1/courts/[externalCourtId]/availability/route";

describe("GET /api/developer/v1/courts/[externalCourtId]/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireDeveloperApiKeyMock.mockResolvedValue({
      organizationId: "org-1",
      integrationId: "integration-1",
      keyId: "key-1",
      scopes: ["availability.read"],
    });
    enforceRateLimitMock.mockResolvedValue({
      ok: true,
      rateLimit: {
        limit: 120,
        remaining: 119,
        reset: 1700000000000,
      },
    });
    getAvailabilityMock.mockResolvedValue({
      options: [{ courtId: "court-1", status: "AVAILABLE" }],
      diagnostics: {
        hasHoursWindows: true,
        hasRateRules: true,
        dayHasHours: true,
        allSlotsBooked: false,
      },
    });
  });

  it("authenticates, rate limits, and returns a wrapped response with headers", async () => {
    const req = new Request(
      "https://example.com/api/developer/v1/courts/ext-court-1/availability?date=2026-03-11T00:00:00.000Z&durationMinutes=60&includeUnavailable=true",
      {
        headers: {
          "x-api-key": "kudos_live_demo_1234",
          "x-request-id": "req-123",
        },
      },
    );

    const response = await GET(req, {
      params: Promise.resolve({ externalCourtId: "ext-court-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(requireDeveloperApiKeyMock).toHaveBeenCalledWith(req, [
      "availability.read",
    ]);
    expect(getAvailabilityMock).toHaveBeenCalledWith(
      expect.objectContaining({ keyId: "key-1" }),
      {
        externalCourtId: "ext-court-1",
        date: "2026-03-11T00:00:00.000Z",
        durationMinutes: 60,
        includeUnavailable: true,
      },
    );
    expect(body).toEqual({
      data: {
        options: [{ courtId: "court-1", status: "AVAILABLE" }],
        diagnostics: {
          hasHoursWindows: true,
          hasRateRules: true,
          dayHasHours: true,
          allSlotsBooked: false,
        },
      },
    });
    expect(response.headers.get("x-request-id")).toBe("req-123");
    expect(response.headers.get("x-ratelimit-limit")).toBe("120");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("119");
  });
});
