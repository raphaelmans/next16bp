import { beforeEach, describe, expect, it, vi } from "vitest";

const listApiKeysMock = vi.fn();
const createApiKeyMock = vi.fn();
const requireApiSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      listApiKeys: listApiKeysMock,
      createApiKey: createApiKeyMock,
    }),
  }),
);

vi.mock("@/lib/shared/infra/auth/api-session", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSessionMock(...args),
}));

vi.mock("@/lib/shared/infra/http/http-rate-limit", () => ({
  enforceRateLimit: (...args: unknown[]) => enforceRateLimitMock(...args),
}));

import {
  GET,
  POST,
} from "@/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/keys/route";

describe("organization developer-integrations keys route", () => {
  const USER_ID = "4ca67b79-eb74-4d48-b0c8-0ec2ac0d8358";
  const ORGANIZATION_ID = "d40cbf2b-6ff7-43bf-b5fd-06871fbc6f08";
  const INTEGRATION_ID = "cda53623-84db-4c2e-9ea1-18565db404d5";

  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
      role: "member",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
  });

  it("GET lists keys for the selected integration", async () => {
    listApiKeysMock.mockResolvedValue([{ id: "key-1" }]);

    const response = await GET(
      new Request(
        `https://example.com/api/organization/organizations/${ORGANIZATION_ID}/developer-integrations/${INTEGRATION_ID}/keys`,
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
    expect(listApiKeysMock).toHaveBeenCalledWith(USER_ID, {
      organizationId: ORGANIZATION_ID,
      integrationId: INTEGRATION_ID,
    });
    expect(body).toEqual({ data: [{ id: "key-1" }] });
  });

  it("POST creates a key for the selected integration", async () => {
    createApiKeyMock.mockResolvedValue({
      apiKey: { id: "key-2" },
      secret: "secret-key",
    });

    const response = await POST(
      new Request(
        `https://example.com/api/organization/organizations/${ORGANIZATION_ID}/developer-integrations/${INTEGRATION_ID}/keys`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "Production key",
            scopes: ["availability.read"],
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
    expect(createApiKeyMock).toHaveBeenCalledWith(USER_ID, {
      organizationId: ORGANIZATION_ID,
      integrationId: INTEGRATION_ID,
      name: "Production key",
      scopes: ["availability.read"],
    });
    expect(body).toEqual({
      data: {
        apiKey: { id: "key-2" },
        secret: "secret-key",
      },
    });
  });
});
