import { beforeEach, describe, expect, it, vi } from "vitest";

const listIntegrationsMock = vi.fn();
const createIntegrationMock = vi.fn();
const requireApiSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      listIntegrations: listIntegrationsMock,
      createIntegration: createIntegrationMock,
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
} from "@/app/api/organization/organizations/[organizationId]/developer-integrations/route";

describe("organization developer-integrations route", () => {
  const USER_ID = "8fe7242d-635d-412c-b4eb-d669ad8f5ff2";
  const ORGANIZATION_ID = "8df8c5ad-fb64-41e3-a150-85c8a6c16f0a";

  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
      role: "member",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
  });

  it("GET lists integrations through the cookie-auth route family", async () => {
    listIntegrationsMock.mockResolvedValue([{ id: "integration-1" }]);

    const response = await GET(
      new Request(
        `https://example.com/api/organization/organizations/${ORGANIZATION_ID}/developer-integrations`,
      ),
      {
        params: Promise.resolve({ organizationId: ORGANIZATION_ID }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listIntegrationsMock).toHaveBeenCalledWith(USER_ID, {
      organizationId: ORGANIZATION_ID,
    });
    expect(body).toEqual({ data: [{ id: "integration-1" }] });
  });

  it("POST creates an integration through the cookie-auth route family", async () => {
    createIntegrationMock.mockResolvedValue({ id: "integration-2" });

    const response = await POST(
      new Request(
        `https://example.com/api/organization/organizations/${ORGANIZATION_ID}/developer-integrations`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Acme OMS" }),
        },
      ),
      {
        params: Promise.resolve({ organizationId: ORGANIZATION_ID }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createIntegrationMock).toHaveBeenCalledWith(USER_ID, {
      organizationId: ORGANIZATION_ID,
      name: "Acme OMS",
    });
    expect(body).toEqual({ data: { id: "integration-2" } });
  });
});
