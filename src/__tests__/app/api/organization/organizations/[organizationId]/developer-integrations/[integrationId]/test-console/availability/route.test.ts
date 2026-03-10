import { beforeEach, describe, expect, it, vi } from "vitest";

const runAvailabilityConsoleMock = vi.fn();
const requireApiSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      runAvailabilityConsole: runAvailabilityConsoleMock,
    }),
  }),
);

vi.mock("@/lib/shared/infra/auth/api-session", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSessionMock(...args),
}));

vi.mock("@/lib/shared/infra/http/http-rate-limit", () => ({
  enforceRateLimit: (...args: unknown[]) => enforceRateLimitMock(...args),
}));

import { POST } from "@/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/test-console/availability/route";

describe("organization developer-integrations test console route", () => {
  const USER_ID = "e427a0da-c712-48be-9072-e403f0c145e4";
  const ORGANIZATION_ID = "15e52930-8f77-4dd0-bad2-1809a9dc4147";
  const INTEGRATION_ID = "71ec1511-e199-4681-88f7-7e438b37f7f6";
  const KEY_ID = "41d8fdde-d591-42fc-a18a-dd3e2549e5e9";

  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
      role: "member",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
    runAvailabilityConsoleMock.mockResolvedValue({
      request: { externalCourtId: "ext-court-1" },
      response: { options: [] },
      requestId: "req-org-console",
    });
  });

  it("POST runs the guided console through the organization route family", async () => {
    const response = await POST(
      new Request(
        `https://example.com/api/organization/organizations/${ORGANIZATION_ID}/developer-integrations/${INTEGRATION_ID}/test-console/availability`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-request-id": "req-org-console",
          },
          body: JSON.stringify({
            keyId: KEY_ID,
            externalCourtId: "ext-court-1",
            date: "2026-03-11T09:00:00.000Z",
            durationMinutes: 60,
          }),
        },
      ),
      {
        params: Promise.resolve({
          organizationId: ORGANIZATION_ID,
          integrationId: INTEGRATION_ID,
        }),
      },
    );
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
      },
      "req-org-console",
    );
    expect(body).toEqual({
      data: {
        request: { externalCourtId: "ext-court-1" },
        response: { options: [] },
        requestId: "req-org-console",
      },
    });
  });
});
