import { and, eq, inArray } from "drizzle-orm";
import {
  type CoachAddonRateRuleRecord,
  type CoachAddonRecord,
  coachAddon,
  coachAddonRateRule,
  type InsertCoachAddon,
  type InsertCoachAddonRateRule,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ICoachAddonRepository {
  findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachAddonRecord[]>;
  findActiveByCoachIds(
    coachIds: string[],
    ctx?: RequestContext,
  ): Promise<CoachAddonRecord[]>;
  findRateRulesByAddonIds(
    addonIds: string[],
    ctx?: RequestContext,
  ): Promise<CoachAddonRateRuleRecord[]>;
  deleteByCoachId(coachId: string, ctx?: RequestContext): Promise<void>;
  createOne(
    data: InsertCoachAddon,
    ctx?: RequestContext,
  ): Promise<CoachAddonRecord>;
  createManyRateRules(
    data: InsertCoachAddonRateRule[],
    ctx?: RequestContext,
  ): Promise<CoachAddonRateRuleRecord[]>;
}

export class CoachAddonRepository implements ICoachAddonRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachAddonRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(coachAddon)
      .where(eq(coachAddon.coachId, coachId));
  }

  async findActiveByCoachIds(
    coachIds: string[],
    ctx?: RequestContext,
  ): Promise<CoachAddonRecord[]> {
    const client = this.getClient(ctx);
    if (coachIds.length === 0) {
      return [];
    }
    return client
      .select()
      .from(coachAddon)
      .where(
        and(
          inArray(coachAddon.coachId, coachIds),
          eq(coachAddon.isActive, true),
        ),
      );
  }

  async findRateRulesByAddonIds(
    addonIds: string[],
    ctx?: RequestContext,
  ): Promise<CoachAddonRateRuleRecord[]> {
    const client = this.getClient(ctx);
    if (addonIds.length === 0) {
      return [];
    }
    return client
      .select()
      .from(coachAddonRateRule)
      .where(inArray(coachAddonRateRule.addonId, addonIds));
  }

  async deleteByCoachId(coachId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(coachAddon).where(eq(coachAddon.coachId, coachId));
  }

  async createOne(
    data: InsertCoachAddon,
    ctx?: RequestContext,
  ): Promise<CoachAddonRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(coachAddon).values(data).returning();
    const inserted = result[0];
    if (!inserted) {
      throw new Error("Failed to insert coach addon");
    }
    return inserted;
  }

  async createManyRateRules(
    data: InsertCoachAddonRateRule[],
    ctx?: RequestContext,
  ): Promise<CoachAddonRateRuleRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) {
      return [];
    }
    return client.insert(coachAddonRateRule).values(data).returning();
  }
}
