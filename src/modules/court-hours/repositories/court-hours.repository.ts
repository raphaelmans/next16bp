import { eq } from "drizzle-orm";
import {
  type CourtHoursWindowRecord,
  courtHoursWindow,
  type InsertCourtHoursWindow,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface ICourtHoursRepository {
  findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtHoursWindowRecord[]>;
  deleteByCourtId(courtId: string, ctx?: RequestContext): Promise<void>;
  createMany(
    data: InsertCourtHoursWindow[],
    ctx?: RequestContext,
  ): Promise<CourtHoursWindowRecord[]>;
}

export class CourtHoursRepository implements ICourtHoursRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtHoursWindowRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(courtHoursWindow)
      .where(eq(courtHoursWindow.courtId, courtId));
  }

  async deleteByCourtId(courtId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(courtHoursWindow)
      .where(eq(courtHoursWindow.courtId, courtId));
  }

  async createMany(
    data: InsertCourtHoursWindow[],
    ctx?: RequestContext,
  ): Promise<CourtHoursWindowRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) return [];
    const result = await client
      .insert(courtHoursWindow)
      .values(data)
      .returning();
    return result;
  }
}
