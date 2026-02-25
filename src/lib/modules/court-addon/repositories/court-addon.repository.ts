import { and, eq, inArray } from "drizzle-orm";
import {
  type CourtAddonRateRuleRecord,
  type CourtAddonRecord,
  courtAddon,
  courtAddonRateRule,
  type InsertCourtAddon,
  type InsertCourtAddonRateRule,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ICourtAddonRepository {
  findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtAddonRecord[]>;
  findByCourtIds(
    courtIds: string[],
    ctx?: RequestContext,
  ): Promise<CourtAddonRecord[]>;
  findActiveByCourtIds(
    courtIds: string[],
    ctx?: RequestContext,
  ): Promise<CourtAddonRecord[]>;
  findRateRulesByAddonIds(
    addonIds: string[],
    ctx?: RequestContext,
  ): Promise<CourtAddonRateRuleRecord[]>;
  deleteByCourtId(courtId: string, ctx?: RequestContext): Promise<void>;
  createOne(
    data: InsertCourtAddon,
    ctx?: RequestContext,
  ): Promise<CourtAddonRecord>;
  createManyRateRules(
    data: InsertCourtAddonRateRule[],
    ctx?: RequestContext,
  ): Promise<CourtAddonRateRuleRecord[]>;
}

export class CourtAddonRepository implements ICourtAddonRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtAddonRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(courtAddon)
      .where(eq(courtAddon.courtId, courtId));
  }

  async findByCourtIds(
    courtIds: string[],
    ctx?: RequestContext,
  ): Promise<CourtAddonRecord[]> {
    const client = this.getClient(ctx);
    if (courtIds.length === 0) return [];
    return client
      .select()
      .from(courtAddon)
      .where(inArray(courtAddon.courtId, courtIds));
  }

  async findActiveByCourtIds(
    courtIds: string[],
    ctx?: RequestContext,
  ): Promise<CourtAddonRecord[]> {
    const client = this.getClient(ctx);
    if (courtIds.length === 0) return [];
    return client
      .select()
      .from(courtAddon)
      .where(
        and(
          inArray(courtAddon.courtId, courtIds),
          eq(courtAddon.isActive, true),
        ),
      );
  }

  async findRateRulesByAddonIds(
    addonIds: string[],
    ctx?: RequestContext,
  ): Promise<CourtAddonRateRuleRecord[]> {
    const client = this.getClient(ctx);
    if (addonIds.length === 0) return [];
    return client
      .select()
      .from(courtAddonRateRule)
      .where(inArray(courtAddonRateRule.addonId, addonIds));
  }

  async deleteByCourtId(courtId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(courtAddon).where(eq(courtAddon.courtId, courtId));
  }

  async createOne(
    data: InsertCourtAddon,
    ctx?: RequestContext,
  ): Promise<CourtAddonRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(courtAddon).values(data).returning();
    const inserted = result[0];
    if (!inserted) {
      throw new Error("Failed to insert court addon");
    }
    return inserted;
  }

  async createManyRateRules(
    data: InsertCourtAddonRateRule[],
    ctx?: RequestContext,
  ): Promise<CourtAddonRateRuleRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) return [];
    return client.insert(courtAddonRateRule).values(data).returning();
  }
}
