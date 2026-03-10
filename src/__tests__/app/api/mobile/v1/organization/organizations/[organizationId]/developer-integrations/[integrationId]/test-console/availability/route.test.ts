import { beforeEach, describe, expect, it, vi } from "vitest";

const runAvailabilityConsoleMock = vi.fn();
const requireMobileSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      runAvailabilityConsole: runAvailabilityConsoleMock,
    }),
  }),
);

vi.mock("@/lib/shared/infra/auth/mobile-session", () => ({
  requireMobileSession: (...args: unknown[]) =>
    requireMobileSessionMock(...args),
}));

vi.mock("@/lib/shared/infra/http/http-rate-limit", () => ({
  enforceRateLimit: (...args: unknown[]) => enforceRateLimitMock(...args),
}));

import { POST } from "@/app/api/mobile/v1/organization/organizations/[organizationId]/developer-integrations/[integrationId]/test-console/availability/route";

describe("POST /api/mobile/v1/organization/organizations/[organizationId]/developer-integrations/[integrationId]/test-console/availability", () => {
  const USER_ID = "424d1d7c-85f5-41de-a685-4e1a2f5844de";
  const ORGANIZATION_ID = "f553ad5a-833a-4c95-b8df-7c6e3cf01904";
  const INTEGRATION_ID = "55e2370f-7698-464b-94b6-b60f555d5f35";
  const KEY_ID = "78fccf4f-8dbd-4db3-b7f1-d0d12a780f0c";

  beforeEach(() => {
    vi.clearAllMocks();
    requireMobileSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
    runAvailabilityConsoleMock.mockResolvedValue({
      request: {
        externalCourtId: "ext-court-1",
        date: "2026-03-11T09:00:00.000Z",
        durationMinutes: 60,
        includeUnavailable: true,
      },
      response: {
        options: [{ courtId: "court-1", status: "AVAILABLE" }],
        diagnostics: { ok: true },
      },
      requestId: "req-console",
    });
  });

  it("parses the body, forwards requestId, and wraps the console response", async () => {
    const req = new Request(
      `https://example.com/api/mobile/v1/organization/organizations/${ORGANIZATION_ID}/developer-integrations/${INTEGRATION_ID}/test-console/availability`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-console",
        },
        body: JSON.stringify({
          keyId: KEY_ID,
          externalCourtId: "ext-court-1",
          date: "2026-03-11T09:00:00.000Z",
          durationMinutes: 60,
          includeUnavailable: true,
        }),
      },
    );

    const response = await POST(req, {
      params: Promise.resolve({
        organizationId: ORGANIZATION_ID,
        integrationId: INTEGRATION_ID,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(runAvailabilityConsoleMock).toHaveBeenCalledWith(
      USER_ID,
      {
        organizationId: ORGANIZATION_ID,
        integrationId: INTEGRATION_ID,
        keyId: KEY_ID,
        externalCourtId: "ext-court-1",
        date: "2026-03-11T09:00:00.000Z",
        durationMinutes: 60,
        includeUnavailable: true,
      },
      "req-console",
    );
    expect(body).toEqual({
      data: {
        request: {
          externalCourtId: "ext-court-1",
          date: "2026-03-11T09:00:00.000Z",
          durationMinutes: 60,
          includeUnavailable: true,
        },
        response: {
          options: [{ courtId: "court-1", status: "AVAILABLE" }],
          diagnostics: { ok: true },
        },
        requestId: "req-console",
      },
    });
  });
});
