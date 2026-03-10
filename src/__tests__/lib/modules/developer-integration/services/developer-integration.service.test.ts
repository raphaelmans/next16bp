import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { DeveloperApiKeyIpNotAllowedError } from "@/lib/modules/developer-integration/errors/developer-integration.errors";
import { DeveloperIntegrationService } from "@/lib/modules/developer-integration/services/developer-integration.service";
import type {
  DeveloperApiKeyRecord,
  DeveloperCourtMappingRecord,
  DeveloperIntegrationRecord,
  DeveloperUnavailabilitySyncRecord,
} from "@/lib/shared/infra/db/schema";

type DeveloperIntegrationServiceDeps = ConstructorParameters<
  typeof DeveloperIntegrationService
>;

const toDeveloperApiKeyRecord = (
  value: Partial<DeveloperApiKeyRecord>,
): DeveloperApiKeyRecord => value as DeveloperApiKeyRecord;

const toDeveloperIntegrationRecord = (
  value: Partial<DeveloperIntegrationRecord>,
): DeveloperIntegrationRecord => value as DeveloperIntegrationRecord;

const toDeveloperCourtMappingRecord = (
  value: Partial<DeveloperCourtMappingRecord>,
): DeveloperCourtMappingRecord => value as DeveloperCourtMappingRecord;

const toDeveloperUnavailabilitySyncRecord = (
  value: Partial<DeveloperUnavailabilitySyncRecord>,
): DeveloperUnavailabilitySyncRecord =>
  value as DeveloperUnavailabilitySyncRecord;

const RAW_API_KEY = "kudos_live_abc123def456_1234567890abcdef1234567890abcdef";
const RAW_API_KEY_HASH = createHash("sha256").update(RAW_API_KEY).digest("hex");

function createHarness(options?: {
  allowedIpCidrs?: string[];
  scopes?: ("availability.read" | "availability.write")[];
}) {
  const repository = {
    listIntegrationsByOrganizationId: vi.fn(),
    findIntegrationById: vi.fn(),
    createIntegration: vi.fn(),
    updateIntegration: vi.fn(),
    listApiKeysByIntegrationId: vi.fn(),
    findApiKeyById: vi.fn(),
    findApiKeyAuthByPrefix: vi.fn(),
    createApiKey: vi.fn(),
    updateApiKey: vi.fn(),
    touchApiKeyUsage: vi.fn(),
    findCourtMappingByCourtId: vi.fn(),
    listCourtMappingsByIntegrationId: vi.fn(),
    findCourtMappingByExternalCourtId: vi.fn(),
    createCourtMapping: vi.fn(),
    updateCourtMapping: vi.fn(),
    deleteCourtMapping: vi.fn(),
    findSyncByExternalWindowId: vi.fn(),
    createSyncRecord: vi.fn(),
    updateSyncRecord: vi.fn(),
  };

  const organizationMemberService = {
    assertOrganizationPermission: vi.fn(),
  };
  const courtRepository = {
    findById: vi.fn(),
  };
  const placeRepository = {
    findById: vi.fn(),
  };
  const availabilityService = {
    getForCourt: vi.fn(),
  };
  const courtBlockService = {
    createMaintenanceForOrganization: vi.fn(),
    updateRangeForOrganization: vi.fn(),
    cancelBlockForOrganization: vi.fn(),
  };
  const transactionManager = {
    run: vi.fn(async (fn: (tx: object) => Promise<unknown>) => fn({})),
  };

  repository.findApiKeyAuthByPrefix.mockResolvedValue({
    apiKey: toDeveloperApiKeyRecord({
      id: "key-1",
      integrationId: "integration-1",
      name: "Primary",
      keyPrefix: "kudos_live_abc123def456",
      secretHash: RAW_API_KEY_HASH,
      lastFour: "cdef",
      scopes: options?.scopes ?? ["availability.read", "availability.write"],
      allowedIpCidrs: options?.allowedIpCidrs ?? [],
      status: "ACTIVE",
      expiresAt: null,
      lastUsedAt: null,
      lastUsedIp: null,
      revokedAt: null,
      createdByUserId: "user-1",
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
    }),
    integration: toDeveloperIntegrationRecord({
      id: "integration-1",
      organizationId: "org-1",
      name: "Acme",
      status: "ACTIVE",
      createdByUserId: "user-1",
      createdAt: new Date("2026-03-10T00:00:00.000Z"),
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
    }),
  });

  const service = new DeveloperIntegrationService(
    repository as unknown as DeveloperIntegrationServiceDeps[0],
    organizationMemberService as unknown as DeveloperIntegrationServiceDeps[1],
    courtRepository as unknown as DeveloperIntegrationServiceDeps[2],
    placeRepository as unknown as DeveloperIntegrationServiceDeps[3],
    availabilityService as unknown as DeveloperIntegrationServiceDeps[4],
    courtBlockService as unknown as DeveloperIntegrationServiceDeps[5],
    transactionManager as unknown as DeveloperIntegrationServiceDeps[6],
  );

  return {
    service,
    repository,
    courtBlockService,
    availabilityService,
  };
}

describe("DeveloperIntegrationService", () => {
  it("authenticates a valid API key and records usage", async () => {
    const { service, repository } = createHarness();

    const result = await service.authenticateApiKey(RAW_API_KEY, "1.2.3.4");

    expect(result).toEqual({
      organizationId: "org-1",
      integrationId: "integration-1",
      keyId: "key-1",
      scopes: ["availability.read", "availability.write"],
    });
    expect(repository.touchApiKeyUsage).toHaveBeenCalledWith(
      "key-1",
      expect.objectContaining({
        lastUsedIp: "1.2.3.4",
        lastUsedAt: expect.any(Date),
      }),
    );
  });

  it("rejects a request when the client IP is outside the allowlist", async () => {
    const { service } = createHarness({
      allowedIpCidrs: ["10.0.0.0/8"],
    });

    await expect(
      service.authenticateApiKey(RAW_API_KEY, "1.2.3.4"),
    ).rejects.toBeInstanceOf(DeveloperApiKeyIpNotAllowedError);
  });

  it("creates a new synced maintenance block for a first-time external window", async () => {
    const { service, repository, courtBlockService } = createHarness();

    repository.findCourtMappingByExternalCourtId.mockResolvedValue(
      toDeveloperCourtMappingRecord({
        id: "mapping-1",
        integrationId: "integration-1",
        courtId: "court-1",
        externalCourtId: "ext-court-1",
      }),
    );
    repository.findSyncByExternalWindowId.mockResolvedValue(null);
    courtBlockService.createMaintenanceForOrganization.mockResolvedValue({
      id: "block-1",
      startTime: new Date("2026-03-11T01:00:00.000Z"),
      endTime: new Date("2026-03-11T02:00:00.000Z"),
    });

    const result = await service.upsertUnavailability(
      {
        organizationId: "org-1",
        integrationId: "integration-1",
        keyId: "key-1",
        scopes: ["availability.write"],
      },
      {
        externalCourtId: "ext-court-1",
        externalWindowId: "window-1",
        startTime: "2026-03-11T01:00:00.000Z",
        endTime: "2026-03-11T02:00:00.000Z",
        reason: "External sync",
      },
    );

    expect(
      courtBlockService.createMaintenanceForOrganization,
    ).toHaveBeenCalledWith(
      "org-1",
      {
        courtId: "court-1",
        startTime: "2026-03-11T01:00:00.000Z",
        endTime: "2026-03-11T02:00:00.000Z",
        reason: "External sync",
      },
      expect.any(Object),
    );
    expect(repository.createSyncRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        integrationId: "integration-1",
        courtId: "court-1",
        courtBlockId: "block-1",
        externalWindowId: "window-1",
        status: "ACTIVE",
      }),
      expect.any(Object),
    );
    expect(result).toEqual(
      expect.objectContaining({
        externalCourtId: "ext-court-1",
        externalWindowId: "window-1",
        courtBlockId: "block-1",
        status: "ACTIVE",
      }),
    );
  });

  it("updates an existing synced external window instead of creating a second block", async () => {
    const { service, repository, courtBlockService } = createHarness();

    repository.findCourtMappingByExternalCourtId.mockResolvedValue(
      toDeveloperCourtMappingRecord({
        id: "mapping-1",
        integrationId: "integration-1",
        courtId: "court-1",
        externalCourtId: "ext-court-1",
      }),
    );
    repository.findSyncByExternalWindowId.mockResolvedValue(
      toDeveloperUnavailabilitySyncRecord({
        id: "sync-1",
        integrationId: "integration-1",
        courtId: "court-1",
        courtBlockId: "block-1",
        externalWindowId: "window-1",
        status: "ACTIVE",
      }),
    );
    courtBlockService.updateRangeForOrganization.mockResolvedValue({
      id: "block-1",
      startTime: new Date("2026-03-11T03:00:00.000Z"),
      endTime: new Date("2026-03-11T04:00:00.000Z"),
    });

    const result = await service.upsertUnavailability(
      {
        organizationId: "org-1",
        integrationId: "integration-1",
        keyId: "key-1",
        scopes: ["availability.write"],
      },
      {
        externalCourtId: "ext-court-1",
        externalWindowId: "window-1",
        startTime: "2026-03-11T03:00:00.000Z",
        endTime: "2026-03-11T04:00:00.000Z",
      },
    );

    expect(courtBlockService.updateRangeForOrganization).toHaveBeenCalledWith(
      "org-1",
      {
        blockId: "block-1",
        startTime: "2026-03-11T03:00:00.000Z",
        endTime: "2026-03-11T04:00:00.000Z",
      },
      expect.any(Object),
    );
    expect(repository.updateSyncRecord).toHaveBeenCalledWith(
      "sync-1",
      expect.objectContaining({
        courtBlockId: "block-1",
        status: "ACTIVE",
      }),
      expect.any(Object),
    );
    expect(result.courtBlockId).toBe("block-1");
  });

  it("runs a precheck with a warning when it auto-selects the first mapped court", async () => {
    const { service, repository, availabilityService } = createHarness();

    repository.findIntegrationById.mockResolvedValue(
      toDeveloperIntegrationRecord({
        id: "integration-1",
        organizationId: "org-1",
        name: "Acme",
        status: "ACTIVE",
      }),
    );
    repository.findApiKeyById.mockResolvedValue(
      toDeveloperApiKeyRecord({
        id: "key-1",
        integrationId: "integration-1",
        status: "ACTIVE",
        scopes: ["availability.read"],
        expiresAt: null,
        revokedAt: null,
      }),
    );
    repository.listCourtMappingsByIntegrationId.mockResolvedValue([
      toDeveloperCourtMappingRecord({
        id: "mapping-1",
        integrationId: "integration-1",
        courtId: "court-1",
        externalCourtId: "ext-court-1",
      }),
    ]);
    repository.findCourtMappingByExternalCourtId.mockResolvedValue(
      toDeveloperCourtMappingRecord({
        id: "mapping-1",
        integrationId: "integration-1",
        courtId: "court-1",
        externalCourtId: "ext-court-1",
      }),
    );
    availabilityService.getForCourt.mockResolvedValue({
      options: [],
      diagnostics: {},
    });

    const result = await service.runPrecheck(
      "user-1",
      {
        organizationId: "org-1",
        integrationId: "integration-1",
        keyId: "key-1",
      },
      "req-precheck",
    );

    expect(result.status).toBe("WARN");
    expect(result.sample.externalCourtId).toBe("ext-court-1");
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "mapping_exists",
          status: "WARN",
        }),
        expect.objectContaining({
          id: "availability_read",
          status: "PASS",
        }),
      ]),
    );
  });

  it("runs a guided availability console request through the selected key context", async () => {
    const { service, repository, availabilityService } = createHarness();

    repository.findIntegrationById.mockResolvedValue(
      toDeveloperIntegrationRecord({
        id: "integration-1",
        organizationId: "org-1",
        name: "Acme",
        status: "ACTIVE",
      }),
    );
    repository.findApiKeyById.mockResolvedValue(
      toDeveloperApiKeyRecord({
        id: "key-1",
        integrationId: "integration-1",
        status: "ACTIVE",
        scopes: ["availability.read"],
        expiresAt: null,
        revokedAt: null,
      }),
    );
    repository.findCourtMappingByExternalCourtId.mockResolvedValue(
      toDeveloperCourtMappingRecord({
        id: "mapping-1",
        integrationId: "integration-1",
        courtId: "court-1",
        externalCourtId: "ext-court-1",
      }),
    );
    availabilityService.getForCourt.mockResolvedValue({
      options: [{ courtId: "court-1", status: "AVAILABLE" }],
      diagnostics: { ok: true },
    });

    const result = await service.runAvailabilityConsole(
      "user-1",
      {
        organizationId: "org-1",
        integrationId: "integration-1",
        keyId: "key-1",
        externalCourtId: "ext-court-1",
        date: "2026-03-11T09:00:00.000Z",
        durationMinutes: 60,
        includeUnavailable: true,
      },
      "req-console",
    );

    expect(availabilityService.getForCourt).toHaveBeenCalledWith({
      courtId: "court-1",
      date: "2026-03-11T09:00:00.000Z",
      durationMinutes: 60,
      includeUnavailable: true,
    });
    expect(result.requestId).toBe("req-console");
    expect(result.response.options[0]).toEqual({
      courtId: "court-1",
      status: "AVAILABLE",
    });
  });

  it("cancels an existing synced window even after its external court mapping is gone", async () => {
    const { service, repository, courtBlockService } = createHarness();

    repository.findSyncByExternalWindowId.mockResolvedValue(
      toDeveloperUnavailabilitySyncRecord({
        id: "sync-1",
        integrationId: "integration-1",
        courtId: "court-1",
        courtBlockId: "block-1",
        externalWindowId: "window-1",
        status: "ACTIVE",
      }),
    );
    courtBlockService.cancelBlockForOrganization.mockResolvedValue({
      id: "block-1",
      courtId: "court-1",
      isActive: false,
    });

    const result = await service.deleteUnavailability(
      {
        organizationId: "org-1",
        integrationId: "integration-1",
        keyId: "key-1",
        scopes: ["availability.write"],
      },
      {
        externalCourtId: "ext-court-1",
        externalWindowId: "window-1",
      },
    );

    expect(courtBlockService.cancelBlockForOrganization).toHaveBeenCalledWith(
      "org-1",
      {
        blockId: "block-1",
      },
      expect.any(Object),
    );
    expect(result).toEqual({
      success: true,
      externalCourtId: "ext-court-1",
      externalWindowId: "window-1",
      status: "CANCELED",
    });
  });
});
