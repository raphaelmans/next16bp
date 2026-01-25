import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  type BookingsImportRowRecord,
  bookingsImportRow,
  type InsertBookingsImportRow,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export type BookingsImportRowStatus =
  | "PENDING"
  | "VALID"
  | "ERROR"
  | "WARNING"
  | "COMMITTED"
  | "SKIPPED";

export interface IBookingsImportRowRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord | null>;
  findByJobId(
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord[]>;
  findByJobIdAndStatus(
    jobId: string,
    statuses: BookingsImportRowStatus[],
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord[]>;
  create(
    data: InsertBookingsImportRow,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord>;
  createMany(
    data: InsertBookingsImportRow[],
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord[]>;
  update(
    id: string,
    data: Partial<InsertBookingsImportRow>,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord>;
  updateStatus(
    id: string,
    status: BookingsImportRowStatus,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
  deleteByJobId(jobId: string, ctx?: RequestContext): Promise<void>;
  countByJobIdAndStatus(
    jobId: string,
    ctx?: RequestContext,
  ): Promise<Record<BookingsImportRowStatus, number>>;
}

export class BookingsImportRowRepository
  implements IBookingsImportRowRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(bookingsImportRow)
      .where(eq(bookingsImportRow.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByJobId(
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(bookingsImportRow)
      .where(eq(bookingsImportRow.jobId, jobId))
      .orderBy(asc(bookingsImportRow.lineNumber));
  }

  async findByJobIdAndStatus(
    jobId: string,
    statuses: BookingsImportRowStatus[],
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(bookingsImportRow)
      .where(
        and(
          eq(bookingsImportRow.jobId, jobId),
          inArray(bookingsImportRow.status, statuses),
        ),
      )
      .orderBy(asc(bookingsImportRow.lineNumber));
  }

  async create(
    data: InsertBookingsImportRow,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(bookingsImportRow)
      .values(data)
      .returning();
    return result[0];
  }

  async createMany(
    data: InsertBookingsImportRow[],
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord[]> {
    if (data.length === 0) return [];
    const client = this.getClient(ctx);
    return client.insert(bookingsImportRow).values(data).returning();
  }

  async update(
    id: string,
    data: Partial<InsertBookingsImportRow>,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(bookingsImportRow)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookingsImportRow.id, id))
      .returning();
    return result[0];
  }

  async updateStatus(
    id: string,
    status: BookingsImportRowStatus,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord> {
    const client = this.getClient(ctx);
    const now = new Date();
    const updates: Partial<InsertBookingsImportRow> = {
      status,
      updatedAt: now,
    };

    if (status === "COMMITTED") {
      updates.committedAt = now;
    }

    const result = await client
      .update(bookingsImportRow)
      .set(updates)
      .where(eq(bookingsImportRow.id, id))
      .returning();
    return result[0];
  }

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(bookingsImportRow).where(eq(bookingsImportRow.id, id));
  }

  async deleteByJobId(jobId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .delete(bookingsImportRow)
      .where(eq(bookingsImportRow.jobId, jobId));
  }

  async countByJobIdAndStatus(
    jobId: string,
    ctx?: RequestContext,
  ): Promise<Record<BookingsImportRowStatus, number>> {
    const client = this.getClient(ctx);
    const result = await client
      .select({
        status: bookingsImportRow.status,
        count: sql<number>`count(*)::int`,
      })
      .from(bookingsImportRow)
      .where(eq(bookingsImportRow.jobId, jobId))
      .groupBy(bookingsImportRow.status);

    const counts: Record<BookingsImportRowStatus, number> = {
      PENDING: 0,
      VALID: 0,
      ERROR: 0,
      WARNING: 0,
      COMMITTED: 0,
      SKIPPED: 0,
    };

    for (const row of result) {
      if (row.status) {
        counts[row.status as BookingsImportRowStatus] = row.count;
      }
    }

    return counts;
  }
}
