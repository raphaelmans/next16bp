import { asc, eq } from "drizzle-orm";
import {
  type BookingsImportSourceRecord,
  bookingsImportSource,
  type InsertBookingsImportSource,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IBookingsImportSourceRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord | null>;
  findByJobId(
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord[]>;
  createMany(
    data: InsertBookingsImportSource[],
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord[]>;
  update(
    id: string,
    data: Partial<InsertBookingsImportSource>,
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord>;
}

export class BookingsImportSourceRepository
  implements IBookingsImportSourceRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(bookingsImportSource)
      .where(eq(bookingsImportSource.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByJobId(
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(bookingsImportSource)
      .where(eq(bookingsImportSource.jobId, jobId))
      .orderBy(asc(bookingsImportSource.sortOrder));
  }

  async createMany(
    data: InsertBookingsImportSource[],
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord[]> {
    if (data.length === 0) return [];
    const client = this.getClient(ctx);
    return client.insert(bookingsImportSource).values(data).returning();
  }

  async update(
    id: string,
    data: Partial<InsertBookingsImportSource>,
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(bookingsImportSource)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookingsImportSource.id, id))
      .returning();
    return result[0];
  }
}
