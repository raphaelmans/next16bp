import { eq, and, lt, gt, ne, gte, lte } from "drizzle-orm";
import {
  timeSlot,
  type TimeSlotRecord,
  type InsertTimeSlot,
} from "@/shared/infra/db/schema";
import type { RequestContext } from "@/shared/kernel/context";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";

export interface ITimeSlotRepository {
  findById(id: string, ctx?: RequestContext): Promise<TimeSlotRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<TimeSlotRecord | null>;
  findByCourtAndDateRange(
    courtId: string,
    startDate: Date,
    endDate: Date,
    status?: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  findAvailable(
    courtId: string,
    startDate: Date,
    endDate: Date,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  findOverlapping(
    courtId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  create(data: InsertTimeSlot, ctx?: RequestContext): Promise<TimeSlotRecord>;
  createMany(
    data: InsertTimeSlot[],
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  update(
    id: string,
    data: Partial<InsertTimeSlot>,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
}

export class TimeSlotRepository implements ITimeSlotRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(timeSlot)
      .where(eq(timeSlot.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<TimeSlotRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(timeSlot)
      .where(eq(timeSlot.id, id))
      .for("update")
      .limit(1);
    return result[0] ?? null;
  }

  async findByCourtAndDateRange(
    courtId: string,
    startDate: Date,
    endDate: Date,
    status?: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    const client = this.getClient(ctx);

    const conditions = [
      eq(timeSlot.courtId, courtId),
      gte(timeSlot.startTime, startDate),
      lte(timeSlot.endTime, endDate),
    ];

    if (status) {
      conditions.push(
        eq(
          timeSlot.status,
          status as "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED",
        ),
      );
    }

    return client
      .select()
      .from(timeSlot)
      .where(and(...conditions))
      .orderBy(timeSlot.startTime);
  }

  async findAvailable(
    courtId: string,
    startDate: Date,
    endDate: Date,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    return this.findByCourtAndDateRange(
      courtId,
      startDate,
      endDate,
      "AVAILABLE",
      ctx,
    );
  }

  /**
   * Find slots that overlap with the given time range.
   * Overlap condition: existing.start < new.end AND existing.end > new.start
   */
  async findOverlapping(
    courtId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    const client = this.getClient(ctx);

    const conditions = [
      eq(timeSlot.courtId, courtId),
      lt(timeSlot.startTime, endTime),
      gt(timeSlot.endTime, startTime),
    ];

    if (excludeId) {
      conditions.push(ne(timeSlot.id, excludeId));
    }

    return client
      .select()
      .from(timeSlot)
      .where(and(...conditions));
  }

  async create(
    data: InsertTimeSlot,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(timeSlot).values(data).returning();
    return result[0];
  }

  async createMany(
    data: InsertTimeSlot[],
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) return [];
    const result = await client.insert(timeSlot).values(data).returning();
    return result;
  }

  async update(
    id: string,
    data: Partial<InsertTimeSlot>,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(timeSlot)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(timeSlot.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(timeSlot).where(eq(timeSlot.id, id));
  }
}
