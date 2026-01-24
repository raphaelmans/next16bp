import { and, eq, gte, inArray, lte } from "drizzle-orm";
import {
  type CourtRateRuleRecord,
  courtRateRule,
  type InsertCourtRateRule,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface ICourtRateRuleRepository {
  findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtRateRuleRecord[]>;
  findByCourtIds(
    courtIds: string[],
    ctx?: RequestContext,
  ): Promise<CourtRateRuleRecord[]>;
  findMatchingRule(
    courtId: string,
    dayOfWeek: number,
    minuteOfDay: number,
    ctx?: RequestContext,
  ): Promise<CourtRateRuleRecord | null>;
  deleteByCourtId(courtId: string, ctx?: RequestContext): Promise<void>;
  createMany(
    data: InsertCourtRateRule[],
    ctx?: RequestContext,
  ): Promise<CourtRateRuleRecord[]>;
}

export class CourtRateRuleRepository implements ICourtRateRuleRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtRateRuleRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(courtRateRule)
      .where(eq(courtRateRule.courtId, courtId));
  }

  async findByCourtIds(
    courtIds: string[],
    ctx?: RequestContext,
  ): Promise<CourtRateRuleRecord[]> {
    const client = this.getClient(ctx);
    if (courtIds.length === 0) return [];
    return client
      .select()
      .from(courtRateRule)
      .where(inArray(courtRateRule.courtId, courtIds));
  }

  async findMatchingRule(
    courtId: string,
    dayOfWeek: number,
    minuteOfDay: number,
    ctx?: RequestContext,
  ): Promise<CourtRateRuleRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(courtRateRule)
      .where(
        and(
          eq(courtRateRule.courtId, courtId),
          eq(courtRateRule.dayOfWeek, dayOfWeek),
          lte(courtRateRule.startMinute, minuteOfDay),
          gte(courtRateRule.endMinute, minuteOfDay + 1),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async deleteByCourtId(courtId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(courtRateRule)
      .where(eq(courtRateRule.courtId, courtId));
  }

  async createMany(
    data: InsertCourtRateRule[],
    ctx?: RequestContext,
  ): Promise<CourtRateRuleRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) return [];
    const result = await client.insert(courtRateRule).values(data).returning();
    return result;
  }
}
