import { and, asc, eq, gt, lt } from "drizzle-orm";
import {
  type CoachBlockRecord,
  coachBlock,
  type InsertCoachBlock,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ICoachBlockRepository {
  findOverlappingByCoachId(
    coachId: string,
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<CoachBlockRecord[]>;
  findByCoachIdInRange(
    coachId: string,
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<CoachBlockRecord[]>;
  findById(id: string, ctx?: RequestContext): Promise<CoachBlockRecord | null>;
  create(
    data: InsertCoachBlock,
    ctx?: RequestContext,
  ): Promise<CoachBlockRecord>;
  deleteById(id: string, ctx?: RequestContext): Promise<void>;
}

export class CoachBlockRepository implements ICoachBlockRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findOverlappingByCoachId(
    coachId: string,
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<CoachBlockRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(coachBlock)
      .where(
        and(
          eq(coachBlock.coachId, coachId),
          lt(coachBlock.startTime, endTime),
          gt(coachBlock.endTime, startTime),
        ),
      );
  }

  async findByCoachIdInRange(
    coachId: string,
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<CoachBlockRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(coachBlock)
      .where(
        and(
          eq(coachBlock.coachId, coachId),
          lt(coachBlock.startTime, endTime),
          gt(coachBlock.endTime, startTime),
        ),
      )
      .orderBy(asc(coachBlock.startTime));
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CoachBlockRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(coachBlock)
      .where(eq(coachBlock.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    data: InsertCoachBlock,
    ctx?: RequestContext,
  ): Promise<CoachBlockRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(coachBlock).values(data).returning();
    const inserted = result[0];
    if (!inserted) {
      throw new Error("Failed to insert coach block");
    }
    return inserted;
  }

  async deleteById(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(coachBlock).where(eq(coachBlock.id, id));
  }
}
