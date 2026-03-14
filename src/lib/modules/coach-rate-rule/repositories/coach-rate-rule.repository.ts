import { and, eq, gte, lte } from "drizzle-orm";
import {
  type CoachRateRuleRecord,
  coachRateRule,
  type InsertCoachRateRule,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ICoachRateRuleRepository {
  findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachRateRuleRecord[]>;
  findMatchingRule(
    coachId: string,
    dayOfWeek: number,
    minuteOfDay: number,
    ctx?: RequestContext,
  ): Promise<CoachRateRuleRecord | null>;
  deleteByCoachId(coachId: string, ctx?: RequestContext): Promise<void>;
  createMany(
    data: InsertCoachRateRule[],
    ctx?: RequestContext,
  ): Promise<CoachRateRuleRecord[]>;
}

export class CoachRateRuleRepository implements ICoachRateRuleRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachRateRuleRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(coachRateRule)
      .where(eq(coachRateRule.coachId, coachId));
  }

  async findMatchingRule(
    coachId: string,
    dayOfWeek: number,
    minuteOfDay: number,
    ctx?: RequestContext,
  ): Promise<CoachRateRuleRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(coachRateRule)
      .where(
        and(
          eq(coachRateRule.coachId, coachId),
          eq(coachRateRule.dayOfWeek, dayOfWeek),
          lte(coachRateRule.startMinute, minuteOfDay),
          gte(coachRateRule.endMinute, minuteOfDay + 1),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async deleteByCoachId(coachId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(coachRateRule)
      .where(eq(coachRateRule.coachId, coachId));
  }

  async createMany(
    data: InsertCoachRateRule[],
    ctx?: RequestContext,
  ): Promise<CoachRateRuleRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) {
      return [];
    }
    return client.insert(coachRateRule).values(data).returning();
  }
}
