import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import type { IAvailabilityService } from "@/lib/modules/availability/services/availability.service";
import { CourtNotFoundError } from "@/lib/modules/court/errors/court.errors";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { ICourtBlockService } from "@/lib/modules/court-block/services/court-block.service";
import type { IOrganizationMemberService } from "@/lib/modules/organization-member/services/organization-member.service";
import { PlaceNotFoundError } from "@/lib/modules/place/errors/place.errors";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type {
  DeveloperApiKeyRecord,
  DeveloperCourtMappingRecord,
  DeveloperIntegrationRecord,
  InsertDeveloperApiKey,
  InsertDeveloperCourtMapping,
  InsertDeveloperIntegration,
  InsertDeveloperUnavailabilitySync,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  CreateDeveloperApiKeyDTO,
  CreateDeveloperIntegrationDTO,
  DeleteDeveloperUnavailabilityDTO,
  DeveloperApiKeyScope,
  GetDeveloperAvailabilityDTO,
  ListDeveloperApiKeysDTO,
  ListDeveloperCourtMappingsDTO,
  ListDeveloperIntegrationsDTO,
  RemoveDeveloperCourtMappingDTO,
  RevokeDeveloperApiKeyDTO,
  RunDeveloperAvailabilityConsoleDTO,
  RunDeveloperPrecheckDTO,
  UpsertDeveloperCourtMappingDTO,
  UpsertDeveloperUnavailabilityDTO,
} from "../dtos/developer-integration.dto";
import {
  DeveloperApiKeyInvalidError,
  DeveloperApiKeyIpNotAllowedError,
  DeveloperApiKeyNotFoundError,
  DeveloperApiKeyScopeDeniedError,
  DeveloperCourtMappingAccessDeniedError,
  DeveloperCourtMappingConflictError,
  DeveloperCourtMappingNotFoundError,
  DeveloperExternalWindowConflictError,
  DeveloperIntegrationNotFoundError,
} from "../errors/developer-integration.errors";
import type { IDeveloperIntegrationRepository } from "../repositories/developer-integration.repository";

const API_KEY_PREFIX = "kudos_live_";
const API_KEY_PREFIX_BYTES = 6;
const API_KEY_SECRET_BYTES = 24;
const DEFAULT_SYNC_REASON = "Synced from external developer integration";

export type DeveloperApiAuthContext = {
  organizationId: string;
  integrationId: string;
  keyId: string;
  scopes: DeveloperApiKeyScope[];
};

export type DeveloperApiKeySummary = Omit<DeveloperApiKeyRecord, "secretHash">;

type GeneratedApiKey = {
  rawKey: string;
  keyPrefix: string;
  secretHash: string;
  lastFour: string;
};

const normalizeKeyInput = (value: string) => value.trim();

function buildApiKeyHash(rawKey: string): string {
  return createHash("sha256").update(normalizeKeyInput(rawKey)).digest("hex");
}

function buildApiKeyMaterial(): GeneratedApiKey {
  const prefix = randomBytes(API_KEY_PREFIX_BYTES).toString("hex");
  const secret = randomBytes(API_KEY_SECRET_BYTES).toString("hex");
  const rawKey = `${API_KEY_PREFIX}${prefix}_${secret}`;

  return {
    rawKey,
    keyPrefix: `${API_KEY_PREFIX}${prefix}`,
    secretHash: buildApiKeyHash(rawKey),
    lastFour: secret.slice(-4),
  };
}

function extractApiKeyPrefix(rawKey: string): string | null {
  const normalized = normalizeKeyInput(rawKey);
  if (!normalized.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const remainder = normalized.slice(API_KEY_PREFIX.length);
  const separator = remainder.indexOf("_");
  if (separator <= 0) {
    return null;
  }

  return `${API_KEY_PREFIX}${remainder.slice(0, separator)}`;
}

function normalizeScopes(scopes: string[]): DeveloperApiKeyScope[] {
  return Array.from(new Set(scopes)) as DeveloperApiKeyScope[];
}

function normalizeAllowedIpCidrs(value?: string[]): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0),
    ),
  );
}

function parseIPv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    const parsed = Number(part);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
      return null;
    }
    result = (result << 8) | parsed;
  }

  return result >>> 0;
}

function isAllowedIpMatch(clientIp: string, rule: string): boolean {
  if (clientIp === rule) return true;

  if (!rule.includes("/")) return false;
  if (isIP(clientIp) !== 4) return false;

  const [baseIp, prefixBitsRaw] = rule.split("/");
  if (!baseIp || !prefixBitsRaw || isIP(baseIp) !== 4) {
    return false;
  }

  const prefixBits = Number(prefixBitsRaw);
  if (!Number.isInteger(prefixBits) || prefixBits < 0 || prefixBits > 32) {
    return false;
  }

  const clientValue = parseIPv4ToInt(clientIp);
  const baseValue = parseIPv4ToInt(baseIp);
  if (clientValue === null || baseValue === null) {
    return false;
  }

  const mask = prefixBits === 0 ? 0 : (0xffffffff << (32 - prefixBits)) >>> 0;

  return (clientValue & mask) === (baseValue & mask);
}

function isIpAllowed(
  allowedIpCidrs: string[],
  clientIp: string | null,
): boolean {
  if (allowedIpCidrs.length === 0) {
    return true;
  }

  if (!clientIp) {
    return false;
  }

  const normalizedIp = clientIp.trim().toLowerCase();
  return allowedIpCidrs.some((rule) => isAllowedIpMatch(normalizedIp, rule));
}

function sanitizeApiKey(record: DeveloperApiKeyRecord): DeveloperApiKeySummary {
  const { secretHash: _secretHash, ...rest } = record;
  return rest;
}

function getDefaultSampleDateIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

export interface IDeveloperIntegrationService {
  listIntegrations(
    userId: string,
    data: ListDeveloperIntegrationsDTO,
  ): Promise<DeveloperIntegrationRecord[]>;
  createIntegration(
    userId: string,
    data: CreateDeveloperIntegrationDTO,
  ): Promise<DeveloperIntegrationRecord>;
  listApiKeys(
    userId: string,
    data: ListDeveloperApiKeysDTO,
  ): Promise<DeveloperApiKeySummary[]>;
  listCourtMappings(
    userId: string,
    data: ListDeveloperCourtMappingsDTO,
  ): Promise<DeveloperCourtMappingRecord[]>;
  createApiKey(
    userId: string,
    data: CreateDeveloperApiKeyDTO,
  ): Promise<{ apiKey: DeveloperApiKeySummary; secret: string }>;
  revokeApiKey(
    userId: string,
    data: RevokeDeveloperApiKeyDTO,
  ): Promise<DeveloperApiKeySummary>;
  upsertCourtMapping(
    userId: string,
    data: UpsertDeveloperCourtMappingDTO,
  ): Promise<DeveloperCourtMappingRecord>;
  removeCourtMapping(
    userId: string,
    data: RemoveDeveloperCourtMappingDTO,
  ): Promise<void>;
  authenticateApiKey(
    rawKey: string,
    clientIp: string | null,
  ): Promise<DeveloperApiAuthContext>;
  assertApiKeyScopes(
    auth: DeveloperApiAuthContext,
    requiredScopes: DeveloperApiKeyScope[],
  ): void;
  getAvailability(
    auth: DeveloperApiAuthContext,
    data: GetDeveloperAvailabilityDTO,
  ): Promise<Awaited<ReturnType<IAvailabilityService["getForCourt"]>>>;
  runPrecheck(
    userId: string,
    data: RunDeveloperPrecheckDTO,
    requestId: string,
  ): Promise<{
    status: "PASS" | "WARN" | "FAIL";
    checks: Array<{
      id: string;
      status: "PASS" | "WARN" | "FAIL";
      title: string;
      message: string;
      requestId?: string;
    }>;
    sample: {
      externalCourtId: string | null;
      date: string;
      durationMinutes: number;
    };
  }>;
  runAvailabilityConsole(
    userId: string,
    data: RunDeveloperAvailabilityConsoleDTO,
    requestId: string,
  ): Promise<{
    request: {
      externalCourtId: string;
      date: string;
      durationMinutes: number;
      includeUnavailable?: boolean;
    };
    response: Awaited<ReturnType<IAvailabilityService["getForCourt"]>>;
    requestId: string;
  }>;
  upsertUnavailability(
    auth: DeveloperApiAuthContext,
    data: UpsertDeveloperUnavailabilityDTO,
  ): Promise<{
    externalCourtId: string;
    externalWindowId: string;
    courtBlockId: string;
    startTime: string;
    endTime: string;
    status: "ACTIVE";
    syncedAt: string;
  }>;
  deleteUnavailability(
    auth: DeveloperApiAuthContext,
    data: DeleteDeveloperUnavailabilityDTO,
  ): Promise<{
    success: true;
    externalCourtId: string;
    externalWindowId: string;
    status: "CANCELED";
  }>;
}

export class DeveloperIntegrationService
  implements IDeveloperIntegrationService
{
  constructor(
    private repository: IDeveloperIntegrationRepository,
    private organizationMemberService: IOrganizationMemberService,
    private courtRepository: ICourtRepository,
    private placeRepository: IPlaceRepository,
    private availabilityService: IAvailabilityService,
    private courtBlockService: ICourtBlockService,
    private transactionManager: TransactionManager,
  ) {}

  private async assertManageAccess(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ) {
    await this.organizationMemberService.assertOrganizationPermission(
      userId,
      organizationId,
      "place.manage",
      ctx,
    );
  }

  private async getIntegrationOrThrow(
    integrationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord> {
    const integration = await this.repository.findIntegrationById(
      integrationId,
      ctx,
    );

    if (!integration) {
      throw new DeveloperIntegrationNotFoundError({ integrationId });
    }

    return integration;
  }

  private async assertIntegrationManageAccess(
    userId: string,
    organizationId: string,
    integrationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord> {
    await this.assertManageAccess(userId, organizationId, ctx);
    const integration = await this.getIntegrationOrThrow(integrationId, ctx);

    if (integration.organizationId !== organizationId) {
      throw new DeveloperIntegrationNotFoundError({
        integrationId,
        organizationId,
      });
    }

    return integration;
  }

  private async assertCourtBelongsToOrganization(
    organizationId: string,
    courtId: string,
    ctx?: RequestContext,
  ) {
    const court = await this.courtRepository.findById(courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError(courtId);
    }

    if (!court.placeId) {
      throw new DeveloperCourtMappingAccessDeniedError({ courtId });
    }

    const place = await this.placeRepository.findById(court.placeId, ctx);
    if (!place) {
      throw new PlaceNotFoundError(court.placeId);
    }

    if (place.organizationId !== organizationId) {
      throw new DeveloperCourtMappingAccessDeniedError({
        courtId,
        organizationId,
      });
    }
  }

  private async resolveMappedCourt(
    integrationId: string,
    externalCourtId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord> {
    const mapping = await this.repository.findCourtMappingByExternalCourtId(
      integrationId,
      externalCourtId.trim(),
      ctx,
    );

    if (!mapping) {
      throw new DeveloperCourtMappingNotFoundError({
        integrationId,
        externalCourtId,
      });
    }

    return mapping;
  }

  private buildSyncRecordPayload(
    data: UpsertDeveloperUnavailabilityDTO,
  ): Record<string, unknown> {
    return {
      externalCourtId: data.externalCourtId,
      externalWindowId: data.externalWindowId,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason ?? null,
    };
  }

  private buildAuthContext(
    integration: DeveloperIntegrationRecord,
    apiKey: DeveloperApiKeyRecord,
  ): DeveloperApiAuthContext {
    return {
      organizationId: integration.organizationId,
      integrationId: integration.id,
      keyId: apiKey.id,
      scopes: normalizeScopes(apiKey.scopes),
    };
  }

  private isApiKeyInternallyUsable(
    integration: DeveloperIntegrationRecord,
    apiKey: DeveloperApiKeyRecord | null,
  ) {
    if (!apiKey || apiKey.integrationId !== integration.id) {
      return false;
    }

    return (
      apiKey.status === "ACTIVE" &&
      !apiKey.revokedAt &&
      (!apiKey.expiresAt || apiKey.expiresAt.getTime() > Date.now()) &&
      integration.status === "ACTIVE"
    );
  }

  private assertInternalApiKeyScope(
    integration: DeveloperIntegrationRecord,
    apiKey: DeveloperApiKeyRecord | null,
    requiredScope: DeveloperApiKeyScope,
  ) {
    if (!apiKey || apiKey.integrationId !== integration.id) {
      throw new DeveloperApiKeyNotFoundError({
        keyId: apiKey?.id,
        integrationId: integration.id,
      });
    }

    if (!this.isApiKeyInternallyUsable(integration, apiKey)) {
      throw new DeveloperApiKeyInvalidError({
        keyId: apiKey.id,
        integrationId: integration.id,
      });
    }

    const auth = this.buildAuthContext(integration, apiKey);
    this.assertApiKeyScopes(auth, [requiredScope]);
    return auth;
  }

  listIntegrations(
    userId: string,
    data: ListDeveloperIntegrationsDTO,
  ): Promise<DeveloperIntegrationRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.assertManageAccess(userId, data.organizationId, ctx);
      return this.repository.listIntegrationsByOrganizationId(
        data.organizationId,
        ctx,
      );
    });
  }

  createIntegration(
    userId: string,
    data: CreateDeveloperIntegrationDTO,
  ): Promise<DeveloperIntegrationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.assertManageAccess(userId, data.organizationId, ctx);

      const insert: InsertDeveloperIntegration = {
        organizationId: data.organizationId,
        name: data.name.trim(),
        status: "ACTIVE",
        createdByUserId: userId,
      };

      const created = await this.repository.createIntegration(insert, ctx);

      logger.info(
        {
          event: "developer_integration.created",
          integrationId: created.id,
          organizationId: created.organizationId,
          userId,
        },
        "Developer integration created",
      );

      return created;
    });
  }

  listApiKeys(
    userId: string,
    data: ListDeveloperApiKeysDTO,
  ): Promise<DeveloperApiKeySummary[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.assertIntegrationManageAccess(
        userId,
        data.organizationId,
        data.integrationId,
        ctx,
      );

      const keys = await this.repository.listApiKeysByIntegrationId(
        data.integrationId,
        ctx,
      );
      return keys.map(sanitizeApiKey);
    });
  }

  listCourtMappings(
    userId: string,
    data: ListDeveloperCourtMappingsDTO,
  ): Promise<DeveloperCourtMappingRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.assertIntegrationManageAccess(
        userId,
        data.organizationId,
        data.integrationId,
        ctx,
      );

      return this.repository.listCourtMappingsByIntegrationId(
        data.integrationId,
        ctx,
      );
    });
  }

  createApiKey(
    userId: string,
    data: CreateDeveloperApiKeyDTO,
  ): Promise<{ apiKey: DeveloperApiKeySummary; secret: string }> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.assertIntegrationManageAccess(
        userId,
        data.organizationId,
        data.integrationId,
        ctx,
      );

      const material = buildApiKeyMaterial();
      const insert: InsertDeveloperApiKey = {
        integrationId: data.integrationId,
        name: data.name.trim(),
        keyPrefix: material.keyPrefix,
        secretHash: material.secretHash,
        lastFour: material.lastFour,
        scopes: normalizeScopes(data.scopes),
        allowedIpCidrs: normalizeAllowedIpCidrs(data.allowedIpCidrs),
        status: "ACTIVE",
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdByUserId: userId,
      };

      const created = await this.repository.createApiKey(insert, ctx);

      logger.info(
        {
          event: "developer_api_key.created",
          keyId: created.id,
          integrationId: created.integrationId,
          organizationId: data.organizationId,
          userId,
          scopes: created.scopes,
        },
        "Developer API key created",
      );

      return {
        apiKey: sanitizeApiKey(created),
        secret: material.rawKey,
      };
    });
  }

  revokeApiKey(
    userId: string,
    data: RevokeDeveloperApiKeyDTO,
  ): Promise<DeveloperApiKeySummary> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.assertIntegrationManageAccess(
        userId,
        data.organizationId,
        data.integrationId,
        ctx,
      );

      const existing = await this.repository.findApiKeyById(data.keyId, ctx);
      if (!existing || existing.integrationId !== data.integrationId) {
        throw new DeveloperApiKeyNotFoundError({
          keyId: data.keyId,
          integrationId: data.integrationId,
        });
      }

      const revoked = await this.repository.updateApiKey(
        existing.id,
        {
          status: "REVOKED",
          revokedAt: new Date(),
        },
        ctx,
      );

      logger.info(
        {
          event: "developer_api_key.revoked",
          keyId: revoked.id,
          integrationId: revoked.integrationId,
          organizationId: data.organizationId,
          userId,
        },
        "Developer API key revoked",
      );

      return sanitizeApiKey(revoked);
    });
  }

  upsertCourtMapping(
    userId: string,
    data: UpsertDeveloperCourtMappingDTO,
  ): Promise<DeveloperCourtMappingRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.assertIntegrationManageAccess(
        userId,
        data.organizationId,
        data.integrationId,
        ctx,
      );
      await this.assertCourtBelongsToOrganization(
        data.organizationId,
        data.courtId,
        ctx,
      );

      const normalizedExternalCourtId = data.externalCourtId.trim();
      const existingByExternal =
        await this.repository.findCourtMappingByExternalCourtId(
          data.integrationId,
          normalizedExternalCourtId,
          ctx,
        );

      if (existingByExternal && existingByExternal.courtId !== data.courtId) {
        throw new DeveloperCourtMappingConflictError({
          integrationId: data.integrationId,
          externalCourtId: normalizedExternalCourtId,
          courtId: data.courtId,
        });
      }

      const existingByCourt = await this.repository.findCourtMappingByCourtId(
        data.integrationId,
        data.courtId,
        ctx,
      );

      if (existingByCourt) {
        return this.repository.updateCourtMapping(
          existingByCourt.id,
          {
            externalCourtId: normalizedExternalCourtId,
          },
          ctx,
        );
      }

      const insert: InsertDeveloperCourtMapping = {
        integrationId: data.integrationId,
        courtId: data.courtId,
        externalCourtId: normalizedExternalCourtId,
      };

      return this.repository.createCourtMapping(insert, ctx);
    });
  }

  removeCourtMapping(
    userId: string,
    data: RemoveDeveloperCourtMappingDTO,
  ): Promise<void> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      await this.assertIntegrationManageAccess(
        userId,
        data.organizationId,
        data.integrationId,
        ctx,
      );

      const mapping = await this.repository.findCourtMappingByCourtId(
        data.integrationId,
        data.courtId,
        ctx,
      );

      if (!mapping) {
        return;
      }

      await this.repository.deleteCourtMapping(mapping.id, ctx);
    });
  }

  async authenticateApiKey(
    rawKey: string,
    clientIp: string | null,
  ): Promise<DeveloperApiAuthContext> {
    const keyPrefix = extractApiKeyPrefix(rawKey);
    if (!keyPrefix) {
      throw new DeveloperApiKeyInvalidError();
    }

    const authRecord = await this.repository.findApiKeyAuthByPrefix(keyPrefix);
    if (!authRecord) {
      throw new DeveloperApiKeyInvalidError({ keyPrefix });
    }

    const normalizedKey = normalizeKeyInput(rawKey);
    if (authRecord.apiKey.secretHash !== buildApiKeyHash(normalizedKey)) {
      throw new DeveloperApiKeyInvalidError({ keyPrefix });
    }

    if (
      authRecord.apiKey.status !== "ACTIVE" ||
      authRecord.apiKey.revokedAt ||
      (authRecord.apiKey.expiresAt &&
        authRecord.apiKey.expiresAt.getTime() <= Date.now()) ||
      authRecord.integration.status !== "ACTIVE"
    ) {
      throw new DeveloperApiKeyInvalidError({
        keyId: authRecord.apiKey.id,
        keyPrefix,
      });
    }

    const allowedIpCidrs = normalizeAllowedIpCidrs(
      authRecord.apiKey.allowedIpCidrs,
    );
    if (!isIpAllowed(allowedIpCidrs, clientIp)) {
      throw new DeveloperApiKeyIpNotAllowedError({
        keyId: authRecord.apiKey.id,
        integrationId: authRecord.integration.id,
        clientIp,
      });
    }

    await this.repository.touchApiKeyUsage(authRecord.apiKey.id, {
      lastUsedAt: new Date(),
      lastUsedIp: clientIp,
    });

    return {
      organizationId: authRecord.integration.organizationId,
      integrationId: authRecord.integration.id,
      keyId: authRecord.apiKey.id,
      scopes: normalizeScopes(authRecord.apiKey.scopes),
    };
  }

  assertApiKeyScopes(
    auth: DeveloperApiAuthContext,
    requiredScopes: DeveloperApiKeyScope[],
  ): void {
    const missing = requiredScopes.filter(
      (scope) => !auth.scopes.includes(scope),
    );
    if (missing.length > 0) {
      throw new DeveloperApiKeyScopeDeniedError({
        keyId: auth.keyId,
        missingScopes: missing,
      });
    }
  }

  async getAvailability(
    auth: DeveloperApiAuthContext,
    data: GetDeveloperAvailabilityDTO,
  ) {
    this.assertApiKeyScopes(auth, ["availability.read"]);
    const mapping = await this.resolveMappedCourt(
      auth.integrationId,
      data.externalCourtId,
    );

    return this.availabilityService.getForCourt({
      courtId: mapping.courtId,
      date: data.date,
      durationMinutes: data.durationMinutes,
      includeUnavailable: data.includeUnavailable,
    });
  }

  runPrecheck(
    userId: string,
    data: RunDeveloperPrecheckDTO,
    requestId: string,
  ): Promise<{
    status: "PASS" | "WARN" | "FAIL";
    checks: Array<{
      id: string;
      status: "PASS" | "WARN" | "FAIL";
      title: string;
      message: string;
      requestId?: string;
    }>;
    sample: {
      externalCourtId: string | null;
      date: string;
      durationMinutes: number;
    };
  }> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const integration = await this.assertIntegrationManageAccess(
        userId,
        data.organizationId,
        data.integrationId,
        ctx,
      );
      const apiKey = await this.repository.findApiKeyById(data.keyId, ctx);
      const mappings = await this.repository.listCourtMappingsByIntegrationId(
        data.integrationId,
        ctx,
      );
      const sampleExternalCourtId =
        data.externalCourtId?.trim() || mappings[0]?.externalCourtId || null;
      const sampleDate = data.date ?? getDefaultSampleDateIso();
      const sampleDurationMinutes = data.durationMinutes ?? 60;

      const checks: Array<{
        id: string;
        status: "PASS" | "WARN" | "FAIL";
        title: string;
        message: string;
        requestId?: string;
      }> = [
        {
          id: "integration_active",
          status: integration.status === "ACTIVE" ? "PASS" : "FAIL",
          title: "Integration active",
          message:
            integration.status === "ACTIVE"
              ? "Integration is active and can be used for developer traffic."
              : "Integration is inactive and must be reactivated before use.",
        },
      ];

      const keyUsable = this.isApiKeyInternallyUsable(integration, apiKey);
      checks.push({
        id: "key_active",
        status: keyUsable ? "PASS" : "FAIL",
        title: "API key active",
        message: keyUsable
          ? "Selected API key is active and not expired."
          : "Selected API key is missing, revoked, expired, or inactive.",
      });

      const hasReadScope = Boolean(
        apiKey &&
          apiKey.integrationId === integration.id &&
          normalizeScopes(apiKey.scopes).includes("availability.read"),
      );
      checks.push({
        id: "key_scope",
        status: hasReadScope ? "PASS" : "FAIL",
        title: "Availability read scope",
        message: hasReadScope
          ? "Key has the required availability.read scope."
          : "Key is missing the availability.read scope.",
      });

      checks.push({
        id: "mapping_exists",
        status: sampleExternalCourtId
          ? data.externalCourtId
            ? "PASS"
            : "WARN"
          : "FAIL",
        title: "Mapped court available",
        message: sampleExternalCourtId
          ? data.externalCourtId
            ? `Mapped external court ${sampleExternalCourtId} is ready for a live read.`
            : `Using the first available mapped court (${sampleExternalCourtId}) for the sample read.`
          : "No mapped external court is available yet. Add at least one mapping.",
      });

      if (
        integration.status === "ACTIVE" &&
        keyUsable &&
        hasReadScope &&
        sampleExternalCourtId
      ) {
        try {
          const auth = this.buildAuthContext(
            integration,
            apiKey as DeveloperApiKeyRecord,
          );
          await this.getAvailability(auth, {
            externalCourtId: sampleExternalCourtId,
            date: sampleDate,
            durationMinutes: sampleDurationMinutes,
            includeUnavailable: false,
          });

          checks.push({
            id: "availability_read",
            status: "PASS",
            title: "Live availability read",
            message: "Sample availability request completed successfully.",
          });
        } catch (error) {
          checks.push({
            id: "availability_read",
            status: "FAIL",
            title: "Live availability read",
            message:
              error instanceof Error
                ? error.message
                : "Sample availability request failed.",
            requestId,
          });
        }
      } else {
        checks.push({
          id: "availability_read",
          status: "FAIL",
          title: "Live availability read",
          message:
            "Sample availability request is blocked until the integration, key, scope, and mapping checks pass.",
          requestId,
        });
      }

      const status = checks.some((check) => check.status === "FAIL")
        ? "FAIL"
        : checks.some((check) => check.status === "WARN")
          ? "WARN"
          : "PASS";

      return {
        status,
        checks,
        sample: {
          externalCourtId: sampleExternalCourtId,
          date: sampleDate,
          durationMinutes: sampleDurationMinutes,
        },
      };
    });
  }

  runAvailabilityConsole(
    userId: string,
    data: RunDeveloperAvailabilityConsoleDTO,
    requestId: string,
  ): Promise<{
    request: {
      externalCourtId: string;
      date: string;
      durationMinutes: number;
      includeUnavailable?: boolean;
    };
    response: Awaited<ReturnType<IAvailabilityService["getForCourt"]>>;
    requestId: string;
  }> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const integration = await this.assertIntegrationManageAccess(
        userId,
        data.organizationId,
        data.integrationId,
        ctx,
      );
      const apiKey = await this.repository.findApiKeyById(data.keyId, ctx);
      const auth = this.assertInternalApiKeyScope(
        integration,
        apiKey,
        "availability.read",
      );

      const response = await this.getAvailability(auth, {
        externalCourtId: data.externalCourtId,
        date: data.date,
        durationMinutes: data.durationMinutes,
        includeUnavailable: data.includeUnavailable,
      });

      return {
        request: {
          externalCourtId: data.externalCourtId,
          date: data.date,
          durationMinutes: data.durationMinutes,
          includeUnavailable: data.includeUnavailable,
        },
        response,
        requestId,
      };
    });
  }

  upsertUnavailability(
    auth: DeveloperApiAuthContext,
    data: UpsertDeveloperUnavailabilityDTO,
  ): Promise<{
    externalCourtId: string;
    externalWindowId: string;
    courtBlockId: string;
    startTime: string;
    endTime: string;
    status: "ACTIVE";
    syncedAt: string;
  }> {
    this.assertApiKeyScopes(auth, ["availability.write"]);

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const mapping = await this.resolveMappedCourt(
        auth.integrationId,
        data.externalCourtId,
        ctx,
      );
      const existingSync = await this.repository.findSyncByExternalWindowId(
        auth.integrationId,
        data.externalWindowId,
        ctx,
      );

      if (existingSync && existingSync.courtId !== mapping.courtId) {
        throw new DeveloperExternalWindowConflictError({
          integrationId: auth.integrationId,
          externalWindowId: data.externalWindowId,
          courtId: mapping.courtId,
          existingCourtId: existingSync.courtId,
        });
      }

      const normalizedReason = data.reason?.trim() || DEFAULT_SYNC_REASON;
      const payload = this.buildSyncRecordPayload(data);

      let courtBlockId = existingSync?.courtBlockId ?? null;

      if (existingSync?.status === "ACTIVE" && courtBlockId) {
        const updatedBlock =
          await this.courtBlockService.updateRangeForOrganization(
            auth.organizationId,
            {
              blockId: courtBlockId,
              startTime: data.startTime,
              endTime: data.endTime,
            },
            ctx,
          );

        courtBlockId = updatedBlock.id;
        await this.repository.updateSyncRecord(
          existingSync.id,
          {
            status: "ACTIVE",
            reason: normalizedReason,
            lastSyncedPayload: payload,
            lastSyncedAt: new Date(),
            courtBlockId,
          },
          ctx,
        );

        return {
          externalCourtId: data.externalCourtId,
          externalWindowId: data.externalWindowId,
          courtBlockId,
          startTime: updatedBlock.startTime.toISOString(),
          endTime: updatedBlock.endTime.toISOString(),
          status: "ACTIVE",
          syncedAt: new Date().toISOString(),
        };
      }

      const createdBlock =
        await this.courtBlockService.createMaintenanceForOrganization(
          auth.organizationId,
          {
            courtId: mapping.courtId,
            startTime: data.startTime,
            endTime: data.endTime,
            reason: normalizedReason,
          },
          ctx,
        );

      courtBlockId = createdBlock.id;

      const syncInsert: InsertDeveloperUnavailabilitySync = {
        integrationId: auth.integrationId,
        courtId: mapping.courtId,
        courtBlockId,
        externalWindowId: data.externalWindowId.trim(),
        status: "ACTIVE",
        reason: normalizedReason,
        lastSyncedPayload: payload,
        lastSyncedAt: new Date(),
      };

      if (existingSync) {
        await this.repository.updateSyncRecord(
          existingSync.id,
          syncInsert,
          ctx,
        );
      } else {
        await this.repository.createSyncRecord(syncInsert, ctx);
      }

      return {
        externalCourtId: data.externalCourtId,
        externalWindowId: data.externalWindowId,
        courtBlockId,
        startTime: createdBlock.startTime.toISOString(),
        endTime: createdBlock.endTime.toISOString(),
        status: "ACTIVE",
        syncedAt: new Date().toISOString(),
      };
    });
  }

  deleteUnavailability(
    auth: DeveloperApiAuthContext,
    data: DeleteDeveloperUnavailabilityDTO,
  ): Promise<{
    success: true;
    externalCourtId: string;
    externalWindowId: string;
    status: "CANCELED";
  }> {
    this.assertApiKeyScopes(auth, ["availability.write"]);

    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const existingSync = await this.repository.findSyncByExternalWindowId(
        auth.integrationId,
        data.externalWindowId,
        ctx,
      );

      if (!existingSync) {
        return {
          success: true,
          externalCourtId: data.externalCourtId,
          externalWindowId: data.externalWindowId,
          status: "CANCELED",
        };
      }

      if (existingSync.status === "ACTIVE" && existingSync.courtBlockId) {
        await this.courtBlockService.cancelBlockForOrganization(
          auth.organizationId,
          {
            blockId: existingSync.courtBlockId,
          },
          ctx,
        );
      }

      await this.repository.updateSyncRecord(
        existingSync.id,
        {
          status: "CANCELED",
          lastSyncedAt: new Date(),
        },
        ctx,
      );

      return {
        success: true,
        externalCourtId: data.externalCourtId,
        externalWindowId: data.externalWindowId,
        status: "CANCELED",
      };
    });
  }
}
