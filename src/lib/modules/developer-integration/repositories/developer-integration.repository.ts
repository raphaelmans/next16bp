import { and, desc, eq } from "drizzle-orm";
import {
  type DeveloperApiKeyRecord,
  type DeveloperCourtMappingRecord,
  type DeveloperIntegrationRecord,
  type DeveloperUnavailabilitySyncRecord,
  developerApiKey,
  developerCourtMapping,
  developerIntegration,
  developerUnavailabilitySync,
  type InsertDeveloperApiKey,
  type InsertDeveloperCourtMapping,
  type InsertDeveloperIntegration,
  type InsertDeveloperUnavailabilitySync,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export type DeveloperApiKeyAuthRecord = {
  apiKey: DeveloperApiKeyRecord;
  integration: DeveloperIntegrationRecord;
};

export interface IDeveloperIntegrationRepository {
  listIntegrationsByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord[]>;
  findIntegrationById(
    integrationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord | null>;
  createIntegration(
    data: InsertDeveloperIntegration,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord>;
  updateIntegration(
    integrationId: string,
    data: Partial<InsertDeveloperIntegration>,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord>;
  listApiKeysByIntegrationId(
    integrationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyRecord[]>;
  findApiKeyById(
    keyId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyRecord | null>;
  findApiKeyAuthByPrefix(
    keyPrefix: string,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyAuthRecord | null>;
  createApiKey(
    data: InsertDeveloperApiKey,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyRecord>;
  updateApiKey(
    keyId: string,
    data: Partial<InsertDeveloperApiKey>,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyRecord>;
  touchApiKeyUsage(
    keyId: string,
    usage: { lastUsedAt: Date; lastUsedIp: string | null },
    ctx?: RequestContext,
  ): Promise<void>;
  findCourtMappingByCourtId(
    integrationId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord | null>;
  listCourtMappingsByIntegrationId(
    integrationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord[]>;
  findCourtMappingByExternalCourtId(
    integrationId: string,
    externalCourtId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord | null>;
  createCourtMapping(
    data: InsertDeveloperCourtMapping,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord>;
  updateCourtMapping(
    mappingId: string,
    data: Partial<InsertDeveloperCourtMapping>,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord>;
  deleteCourtMapping(mappingId: string, ctx?: RequestContext): Promise<void>;
  findSyncByExternalWindowId(
    integrationId: string,
    externalWindowId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperUnavailabilitySyncRecord | null>;
  createSyncRecord(
    data: InsertDeveloperUnavailabilitySync,
    ctx?: RequestContext,
  ): Promise<DeveloperUnavailabilitySyncRecord>;
  updateSyncRecord(
    syncId: string,
    data: Partial<InsertDeveloperUnavailabilitySync>,
    ctx?: RequestContext,
  ): Promise<DeveloperUnavailabilitySyncRecord>;
}

export class DeveloperIntegrationRepository
  implements IDeveloperIntegrationRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async listIntegrationsByOrganizationId(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(developerIntegration)
      .where(eq(developerIntegration.organizationId, organizationId))
      .orderBy(desc(developerIntegration.createdAt));
  }

  async findIntegrationById(
    integrationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(developerIntegration)
      .where(eq(developerIntegration.id, integrationId))
      .limit(1);
    return rows[0] ?? null;
  }

  async createIntegration(
    data: InsertDeveloperIntegration,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .insert(developerIntegration)
      .values(data)
      .returning();
    return rows[0];
  }

  async updateIntegration(
    integrationId: string,
    data: Partial<InsertDeveloperIntegration>,
    ctx?: RequestContext,
  ): Promise<DeveloperIntegrationRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .update(developerIntegration)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(developerIntegration.id, integrationId))
      .returning();
    return rows[0];
  }

  async listApiKeysByIntegrationId(
    integrationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(developerApiKey)
      .where(eq(developerApiKey.integrationId, integrationId))
      .orderBy(desc(developerApiKey.createdAt));
  }

  async findApiKeyById(
    keyId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(developerApiKey)
      .where(eq(developerApiKey.id, keyId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findApiKeyAuthByPrefix(
    keyPrefix: string,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyAuthRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select({
        apiKey: developerApiKey,
        integration: developerIntegration,
      })
      .from(developerApiKey)
      .innerJoin(
        developerIntegration,
        eq(developerIntegration.id, developerApiKey.integrationId),
      )
      .where(eq(developerApiKey.keyPrefix, keyPrefix))
      .limit(1);

    return rows[0] ?? null;
  }

  async createApiKey(
    data: InsertDeveloperApiKey,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyRecord> {
    const client = this.getClient(ctx);
    const rows = await client.insert(developerApiKey).values(data).returning();
    return rows[0];
  }

  async updateApiKey(
    keyId: string,
    data: Partial<InsertDeveloperApiKey>,
    ctx?: RequestContext,
  ): Promise<DeveloperApiKeyRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .update(developerApiKey)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(developerApiKey.id, keyId))
      .returning();
    return rows[0];
  }

  async touchApiKeyUsage(
    keyId: string,
    usage: { lastUsedAt: Date; lastUsedIp: string | null },
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .update(developerApiKey)
      .set({
        lastUsedAt: usage.lastUsedAt,
        lastUsedIp: usage.lastUsedIp,
        updatedAt: usage.lastUsedAt,
      })
      .where(eq(developerApiKey.id, keyId));
  }

  async findCourtMappingByCourtId(
    integrationId: string,
    courtId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(developerCourtMapping)
      .where(
        and(
          eq(developerCourtMapping.integrationId, integrationId),
          eq(developerCourtMapping.courtId, courtId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async listCourtMappingsByIntegrationId(
    integrationId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(developerCourtMapping)
      .where(eq(developerCourtMapping.integrationId, integrationId))
      .orderBy(desc(developerCourtMapping.createdAt));
  }

  async findCourtMappingByExternalCourtId(
    integrationId: string,
    externalCourtId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(developerCourtMapping)
      .where(
        and(
          eq(developerCourtMapping.integrationId, integrationId),
          eq(developerCourtMapping.externalCourtId, externalCourtId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async createCourtMapping(
    data: InsertDeveloperCourtMapping,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .insert(developerCourtMapping)
      .values(data)
      .returning();
    return rows[0];
  }

  async updateCourtMapping(
    mappingId: string,
    data: Partial<InsertDeveloperCourtMapping>,
    ctx?: RequestContext,
  ): Promise<DeveloperCourtMappingRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .update(developerCourtMapping)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(developerCourtMapping.id, mappingId))
      .returning();
    return rows[0];
  }

  async deleteCourtMapping(
    mappingId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(developerCourtMapping)
      .where(eq(developerCourtMapping.id, mappingId));
  }

  async findSyncByExternalWindowId(
    integrationId: string,
    externalWindowId: string,
    ctx?: RequestContext,
  ): Promise<DeveloperUnavailabilitySyncRecord | null> {
    const client = this.getClient(ctx);
    const rows = await client
      .select()
      .from(developerUnavailabilitySync)
      .where(
        and(
          eq(developerUnavailabilitySync.integrationId, integrationId),
          eq(developerUnavailabilitySync.externalWindowId, externalWindowId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async createSyncRecord(
    data: InsertDeveloperUnavailabilitySync,
    ctx?: RequestContext,
  ): Promise<DeveloperUnavailabilitySyncRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .insert(developerUnavailabilitySync)
      .values(data)
      .returning();
    return rows[0];
  }

  async updateSyncRecord(
    syncId: string,
    data: Partial<InsertDeveloperUnavailabilitySync>,
    ctx?: RequestContext,
  ): Promise<DeveloperUnavailabilitySyncRecord> {
    const client = this.getClient(ctx);
    const rows = await client
      .update(developerUnavailabilitySync)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(developerUnavailabilitySync.id, syncId))
      .returning();
    return rows[0];
  }
}
