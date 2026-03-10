import { beforeEach, describe, expect, it, vi } from "vitest";

const runPrecheckMock = vi.fn();
const requireMobileSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      runPrecheck: runPrecheckMock,
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

import { POST } from "@/app/api/mobile/v1/organization/organizations/[organizationId]/developer-integrations/[integrationId]/precheck/route";

describe("POST /api/mobile/v1/organization/organizations/[organizationId]/developer-integrations/[integrationId]/precheck", () => {
  const USER_ID = "8c3ea5d1-81b8-4a27-b8e0-b8e7f16b6ad4";
  const ORGANIZATION_ID = "e7d1ecb1-fd99-4b47-a8f4-ef2d54ec2ee4";
  const INTEGRATION_ID = "0c99b0ef-2a2d-40b6-a00f-d50b4b2bd8d6";
  const KEY_ID = "77b446d3-8ef2-44c0-bd07-5cc637b8a51a";

  beforeEach(() => {
    vi.clearAllMocks();
    requireMobileSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
    runPrecheckMock.mockResolvedValue({
      status: "PASS",
      checks: [
        {
          id: "integration_active",
          status: "PASS",
          title: "Integration active",
          message: "Integration is ready.",
        },
      ],
      sample: {
        externalCourtId: "ext-court-1",
        date: "2026-03-11T09:00:00.000Z",
        durationMinutes: 60,
      },
    });
  });

  it("parses input, forwards requestId, and wraps the response", async () => {
    const req = new Request(
      `https://example.com/api/mobile/v1/organization/organizations/${ORGANIZATION_ID}/developer-integrations/${INTEGRATION_ID}/precheck`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-123",
        },
        body: JSON.stringify({
          keyId: KEY_ID,
          externalCourtId: "ext-court-1",
          date: "2026-03-11T09:00:00.000Z",
          durationMinutes: 60,
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
    expect(response.headers.get("Deprecation")).toBe("true");
    expect(response.headers.get("Sunset")).toBe(
      "Thu, 31 Dec 2026 00:00:00 GMT",
    );
    expect(runPrecheckMock).toHaveBeenCalledWith(
      USER_ID,
      {
        organizationId: ORGANIZATION_ID,
        integrationId: INTEGRATION_ID,
        keyId: KEY_ID,
        externalCourtId: "ext-court-1",
        date: "2026-03-11T09:00:00.000Z",
        durationMinutes: 60,
      },
      "req-123",
    );
    expect(body).toEqual({
      data: {
        status: "PASS",
        checks: [
          {
            id: "integration_active",
            status: "PASS",
            title: "Integration active",
            message: "Integration is ready.",
          },
        ],
        sample: {
          externalCourtId: "ext-court-1",
          date: "2026-03-11T09:00:00.000Z",
          durationMinutes: 60,
        },
      },
    });
  });
});
