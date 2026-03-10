import { describe, expect, it, vi } from "vitest";
import type { IOrganizationDevelopersClient } from "@/common/clients/organization-developers-client";
import { DevelopersApi } from "@/features/developers/api";
import {
  developerIntegrationsResponseSchema,
  developerPrecheckResponseSchema,
} from "@/features/developers/schemas";

describe("DevelopersApi", () => {
  it("uses the non-mobile organization route family for integrations", async () => {
    const getMock = vi.fn().mockResolvedValue({
      data: [],
    });
    const clientApi = {
      get: getMock,
    } as unknown as IOrganizationDevelopersClient;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new DevelopersApi({ clientApi, toAppError });

    await api.listIntegrations({ organizationId: "org-1" });

    expect(getMock).toHaveBeenCalledWith(
      "/api/organization/organizations/org-1/developer-integrations",
      developerIntegrationsResponseSchema,
      { signal: undefined },
    );
  });

  it("uses the non-mobile organization route family for precheck", async () => {
    const postMock = vi.fn().mockResolvedValue({
      data: {
        status: "PASS",
        checks: [],
        sample: {
          externalCourtId: null,
          date: "2026-03-11T09:00:00.000Z",
          durationMinutes: 60,
        },
      },
    });
    const clientApi = {
      post: postMock,
    } as unknown as IOrganizationDevelopersClient;
    const toAppError = vi.fn((error: unknown) => error as never);
    const api = new DevelopersApi({ clientApi, toAppError });

    await api.runPrecheck({
      organizationId: "org-1",
      integrationId: "integration-1",
      input: { keyId: "key-1" },
    });

    expect(postMock).toHaveBeenCalledWith(
      "/api/organization/organizations/org-1/developer-integrations/integration-1/precheck",
      developerPrecheckResponseSchema,
      {
        json: { keyId: "key-1" },
      },
    );
  });
});
