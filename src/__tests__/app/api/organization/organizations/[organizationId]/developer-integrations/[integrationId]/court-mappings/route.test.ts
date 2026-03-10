import { beforeEach, describe, expect, it, vi } from "vitest";

const listCourtMappingsMock = vi.fn();
const requireApiSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      listCourtMappings: listCourtMappingsMock,
    }),
  }),
);

vi.mock("@/lib/shared/infra/auth/api-session", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSessionMock(...args),
}));

vi.mock("@/lib/shared/infra/http/http-rate-limit", () => ({
  enforceRateLimit: (...args: unknown[]) => enforceRateLimitMock(...args),
}));

import { GET } from "@/app/api/organization/organizations/[organizationId]/developer-integrations/[integrationId]/court-mappings/route";

describe("organization developer-integrations court mappings route", () => {
  const USER_ID = "a620bd10-91b0-4fe6-a5aa-8db9fbeb2cb5";
  const ORGANIZATION_ID = "bb707a5f-a530-4756-8478-8454ab5afe4f";
  const INTEGRATION_ID = "76036388-f4fd-44af-b55d-d6f5eb4db527";

  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
      role: "member",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
    listCourtMappingsMock.mockResolvedValue([
      { id: "mapping-1", externalCourtId: "ext-court-1" },
    ]);
  });

  it("GET lists mappings through the organization route family", async () => {
    const response = await GET(
      new Request(
        `https://example.com/api/organization/organizations/${ORGANIZATION_ID}/developer-integrations/${INTEGRATION_ID}/court-mappings`,
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
    expect(listCourtMappingsMock).toHaveBeenCalledWith(USER_ID, {
      organizationId: ORGANIZATION_ID,
      integrationId: INTEGRATION_ID,
    });
    expect(body).toEqual({
      data: [{ id: "mapping-1", externalCourtId: "ext-court-1" }],
    });
  });
});
