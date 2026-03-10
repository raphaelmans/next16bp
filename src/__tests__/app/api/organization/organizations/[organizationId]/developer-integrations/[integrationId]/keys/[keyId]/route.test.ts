import { beforeEach, describe, expect, it, vi } from "vitest";

const revokeApiKeyMock = vi.fn();
const requireApiSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      revokeApiKey: revokeApiKeyMock,
    }),
  }),
);

vi.mock("@/lib/shared/infra/auth/api-session", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSessionMock(...args),
}));

vi.mock("@/lib/shared/infra/http/http-rate-limit", () => ({
  enforceRateLimit: (...args: unknown[]) => enforceRateLimitMock(...args),
}));

import { DELETE } from "@/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/keys/[keyId]/route";

describe("organization developer-integrations revoke key route", () => {
  const USER_ID = "8910c42b-f57b-4168-bb52-df0e080cc2df";
  const ORGANIZATION_ID = "0a19703c-c7f9-4d64-af89-59b97ae35318";
  const INTEGRATION_ID = "7e8d9c42-3c79-4972-8fcc-f224bdb75238";
  const KEY_ID = "2a83034a-ec51-4da8-91ed-f9bd44de5fc0";

  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
      role: "member",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
    revokeApiKeyMock.mockResolvedValue({ id: KEY_ID, status: "REVOKED" });
  });

  it("DELETE revokes the selected key", async () => {
    const response = await DELETE(
      new Request(
        `https://example.com/api/organization/organizations/${ORGANIZATION_ID}/developer-integrations/${INTEGRATION_ID}/keys/${KEY_ID}`,
        { method: "DELETE" },
      ),
      {
        params: Promise.resolve({
          organizationId: ORGANIZATION_ID,
          integrationId: INTEGRATION_ID,
          keyId: KEY_ID,
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(revokeApiKeyMock).toHaveBeenCalledWith(USER_ID, {
      organizationId: ORGANIZATION_ID,
      integrationId: INTEGRATION_ID,
      keyId: KEY_ID,
    });
    expect(body).toEqual({ data: { id: KEY_ID, status: "REVOKED" } });
  });
});
