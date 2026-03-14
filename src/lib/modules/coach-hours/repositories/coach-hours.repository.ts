import { eq } from "drizzle-orm";
import {
  type CoachHoursWindowRecord,
  coachHoursWindow,
  type InsertCoachHoursWindow,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ICoachHoursRepository {
  findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachHoursWindowRecord[]>;
  deleteByCoachId(coachId: string, ctx?: RequestContext): Promise<void>;
  createMany(
    data: InsertCoachHoursWindow[],
    ctx?: RequestContext,
  ): Promise<CoachHoursWindowRecord[]>;
}

export class CoachHoursRepository implements ICoachHoursRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByCoachId(
    coachId: string,
    ctx?: RequestContext,
  ): Promise<CoachHoursWindowRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(coachHoursWindow)
      .where(eq(coachHoursWindow.coachId, coachId));
  }

  async deleteByCoachId(coachId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(coachHoursWindow)
      .where(eq(coachHoursWindow.coachId, coachId));
  }

  async createMany(
    data: InsertCoachHoursWindow[],
    ctx?: RequestContext,
  ): Promise<CoachHoursWindowRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) {
      return [];
    }
    return client.insert(coachHoursWindow).values(data).returning();
  }
}
