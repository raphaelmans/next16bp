import { and, asc, eq, gt, inArray, lt } from "drizzle-orm";
import {
  type CourtBlockRecord,
  courtBlock,
  type InsertCourtBlock,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

type CourtBlockOverlapOptions = {
  includeInactive?: boolean;
};

export interface ICourtBlockRepository {
  findOverlappingByCourtIds(
    courtIds: string[],
    startTime: Date,
    endTime: Date,
    options?: CourtBlockOverlapOptions,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord[]>;
  findByCourtIdInRange(
    courtId: string,
    startTime: Date,
    endTime: Date,
    options?: CourtBlockOverlapOptions,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord[]>;
  findById(id: string, ctx?: RequestContext): Promise<CourtBlockRecord | null>;
  create(
    data: InsertCourtBlock,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord>;
  update(
    id: string,
    data: Partial<InsertCourtBlock>,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord>;
}

export class CourtBlockRepository implements ICourtBlockRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findOverlappingByCourtIds(
    courtIds: string[],
    startTime: Date,
    endTime: Date,
    options?: CourtBlockOverlapOptions,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord[]> {
    const client = this.getClient(ctx);
    if (courtIds.length === 0) return [];

    const includeInactive = options?.includeInactive ?? false;
    const filters = [
      inArray(courtBlock.courtId, courtIds),
      lt(courtBlock.startTime, endTime),
      gt(courtBlock.endTime, startTime),
    ];
    if (!includeInactive) {
      filters.push(eq(courtBlock.isActive, true));
    }

    return client
      .select()
      .from(courtBlock)
      .where(and(...filters));
  }

  async findByCourtIdInRange(
    courtId: string,
    startTime: Date,
    endTime: Date,
    options?: CourtBlockOverlapOptions,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord[]> {
    const client = this.getClient(ctx);
    const includeInactive = options?.includeInactive ?? false;
    const filters = [
      eq(courtBlock.courtId, courtId),
      lt(courtBlock.startTime, endTime),
      gt(courtBlock.endTime, startTime),
    ];
    if (!includeInactive) {
      filters.push(eq(courtBlock.isActive, true));
    }

    return client
      .select()
      .from(courtBlock)
      .where(and(...filters))
      .orderBy(asc(courtBlock.startTime));
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(courtBlock)
      .where(eq(courtBlock.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    data: InsertCourtBlock,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(courtBlock).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertCourtBlock>,
    ctx?: RequestContext,
  ): Promise<CourtBlockRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(courtBlock)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courtBlock.id, id))
      .returning();
    return result[0];
  }
}
