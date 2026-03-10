import { describe, expect, it } from "vitest";
import {
  buildDeveloperCurlSnippet,
  buildDeveloperJsSnippet,
  buildDeveloperLaunchpad,
  getDeveloperCheckSummary,
  getSnippetApiKeyValue,
  getValidDeveloperKeyId,
  getValidMappedCourtId,
} from "@/features/developers/helpers";

describe("developers helpers", () => {
  it("builds launchpad progress from integrations, keys, mappings, and precheck", () => {
    const result = buildDeveloperLaunchpad({
      integrationsCount: 1,
      keysCount: 1,
      mappingsCount: 0,
      precheck: null,
    });

    expect(result.map((item) => item.done)).toEqual([true, true, false, false]);
  });

  it("builds a curl snippet with the current sample values", () => {
    const snippet = buildDeveloperCurlSnippet({
      origin: "https://example.com",
      externalCourtId: "court-ext-1",
      date: "2026-03-11T09:00:00.000Z",
      durationMinutes: 60,
      includeUnavailable: true,
      apiKey: "secret-key",
    });

    expect(snippet).toContain(
      "/api/developer/v1/courts/court-ext-1/availability",
    );
    expect(snippet).toContain("X-API-Key: secret-key");
    expect(snippet).toContain("includeUnavailable=true");
  });

  it("builds a JavaScript snippet and summarizes precheck counts", () => {
    const jsSnippet = buildDeveloperJsSnippet({
      origin: "https://example.com",
      externalCourtId: "court-ext-1",
      date: "2026-03-11T09:00:00.000Z",
      durationMinutes: 90,
    });

    const summary = getDeveloperCheckSummary([
      {
        id: "one",
        status: "PASS",
        title: "Good",
        message: "Done",
      },
      {
        id: "two",
        status: "WARN",
        title: "Careful",
        message: "Review",
      },
      {
        id: "three",
        status: "FAIL",
        title: "Broken",
        message: "Fix",
      },
    ]);

    expect(jsSnippet).toContain("YOUR_API_KEY");
    expect(summary).toEqual({ passed: 1, warned: 1, failed: 1 });
  });

  it("keeps selections valid when integrations change", () => {
    expect(
      getValidMappedCourtId("ext-2", [
        {
          id: "mapping-1",
          integrationId: "integration-1",
          courtId: "court-1",
          externalCourtId: "ext-1",
          createdAt: "2026-03-10T00:00:00.000Z",
          updatedAt: "2026-03-10T00:00:00.000Z",
        },
      ]),
    ).toBe("ext-1");

    expect(
      getValidDeveloperKeyId("missing-key", [
        {
          id: "key-1",
          integrationId: "integration-1",
          name: "Primary",
          keyPrefix: "kudos_live_abc",
          lastFour: "1234",
          scopes: ["availability.read"],
          allowedIpCidrs: [],
          status: "ACTIVE",
          expiresAt: null,
          lastUsedAt: null,
          lastUsedIp: null,
          revokedAt: null,
          createdByUserId: "user-1",
          createdAt: "2026-03-10T00:00:00.000Z",
          updatedAt: "2026-03-10T00:00:00.000Z",
        },
      ]),
    ).toBe("key-1");

    expect(
      getValidDeveloperKeyId("revoked-key", [
        {
          id: "revoked-key",
          integrationId: "integration-1",
          name: "Revoked",
          keyPrefix: "kudos_live_old",
          lastFour: "0000",
          scopes: ["availability.read"],
          allowedIpCidrs: [],
          status: "REVOKED",
          expiresAt: null,
          lastUsedAt: null,
          lastUsedIp: null,
          revokedAt: "2026-03-11T00:00:00.000Z",
          createdByUserId: "user-1",
          createdAt: "2026-03-10T00:00:00.000Z",
          updatedAt: "2026-03-11T00:00:00.000Z",
        },
        {
          id: "key-1",
          integrationId: "integration-1",
          name: "Primary",
          keyPrefix: "kudos_live_abc",
          lastFour: "1234",
          scopes: ["availability.read"],
          allowedIpCidrs: [],
          status: "ACTIVE",
          expiresAt: null,
          lastUsedAt: null,
          lastUsedIp: null,
          revokedAt: null,
          createdByUserId: "user-1",
          createdAt: "2026-03-10T00:00:00.000Z",
          updatedAt: "2026-03-10T00:00:00.000Z",
        },
      ]),
    ).toBe("key-1");
  });

  it("only exposes the latest revealed secret when it matches the selected key", () => {
    expect(
      getSnippetApiKeyValue({
        selectedKeyId: "key-1",
        latestRevealedSecret: {
          keyId: "key-1",
          secret: "secret-key",
        },
      }),
    ).toBe("secret-key");

    expect(
      getSnippetApiKeyValue({
        selectedKeyId: "key-2",
        latestRevealedSecret: {
          keyId: "key-1",
          secret: "secret-key",
        },
      }),
    ).toBeNull();
  });
});
