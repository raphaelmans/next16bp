import { beforeEach, describe, expect, it, vi } from "vitest";

const listCourtMappingsMock = vi.fn();
const requireMobileSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock(
  "@/lib/modules/developer-integration/factories/developer-integration.factory",
  () => ({
    makeDeveloperIntegrationService: () => ({
      listCourtMappings: listCourtMappingsMock,
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

import { GET } from "@/app/api/mobile/v1/organization/organizations/[organizationId]/developer-integrations/[integrationId]/court-mappings/route";

describe("GET /api/mobile/v1/organization/organizations/[organizationId]/developer-integrations/[integrationId]/court-mappings", () => {
  const USER_ID = "42f6b5dd-1e6d-42d7-a4b7-c973f46b680c";
  const ORGANIZATION_ID = "6204a050-1f20-49cb-bdfc-a3207ff80da0";
  const INTEGRATION_ID = "9bb343d1-0a96-4304-8426-5c0478f0c0d8";

  beforeEach(() => {
    vi.clearAllMocks();
    requireMobileSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
    listCourtMappingsMock.mockResolvedValue([
      {
        id: "mapping-1",
        integrationId: INTEGRATION_ID,
        courtId: "court-1",
        externalCourtId: "ext-court-1",
      },
    ]);
  });

  it("wraps the list response and forwards org/integration ids", async () => {
    const req = new Request(
      `https://example.com/api/mobile/v1/organization/organizations/${ORGANIZATION_ID}/developer-integrations/${INTEGRATION_ID}/court-mappings`,
    );

    const response = await GET(req, {
      params: Promise.resolve({
        organizationId: ORGANIZATION_ID,
        integrationId: INTEGRATION_ID,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listCourtMappingsMock).toHaveBeenCalledWith(USER_ID, {
      organizationId: ORGANIZATION_ID,
      integrationId: INTEGRATION_ID,
    });
    expect(body).toEqual({
      data: [
        {
          id: "mapping-1",
          integrationId: INTEGRATION_ID,
          courtId: "court-1",
          externalCourtId: "ext-court-1",
        },
      ],
    });
  });
});
