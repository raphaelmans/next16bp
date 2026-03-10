import { beforeEach, describe, expect, it, vi } from "vitest";

const runPrecheckMock = vi.fn();
const requireApiSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      runPrecheck: runPrecheckMock,
    }),
  }),
);

vi.mock("@/lib/shared/infra/auth/api-session", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSessionMock(...args),
}));

vi.mock("@/lib/shared/infra/http/http-rate-limit", () => ({
  enforceRateLimit: (...args: unknown[]) => enforceRateLimitMock(...args),
}));

import { POST } from "@/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/precheck/route";

describe("organization developer-integrations precheck route", () => {
  const USER_ID = "bde9bed0-a96d-4454-b5dc-65e4e19e58c4";
  const ORGANIZATION_ID = "c4bc700e-ad7a-426a-abde-f8177ac19a24";
  const INTEGRATION_ID = "4e91dd6c-3fe8-4070-8af6-3048e3dc01fe";
  const KEY_ID = "39e56d72-49a0-40be-9d6c-9dbe8200d161";

  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
      role: "member",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
    runPrecheckMock.mockResolvedValue({
      status: "PASS",
      checks: [],
      sample: {},
    });
  });

  it("POST forwards requestId and parsed body through the organization route family", async () => {
    const response = await POST(
      new Request(
        `https://example.com/api/organization/organizations/${ORGANIZATION_ID}/developer-integrations/${INTEGRATION_ID}/precheck`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-request-id": "req-org-precheck",
          },
          body: JSON.stringify({ keyId: KEY_ID }),
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
    expect(runPrecheckMock).toHaveBeenCalledWith(
      USER_ID,
      {
        organizationId: ORGANIZATION_ID,
        integrationId: INTEGRATION_ID,
        keyId: KEY_ID,
      },
      "req-org-precheck",
    );
    expect(body).toEqual({ data: { status: "PASS", checks: [], sample: {} } });
  });
});
