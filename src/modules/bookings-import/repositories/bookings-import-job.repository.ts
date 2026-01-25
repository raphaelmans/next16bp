import { and, desc, eq, inArray, ne } from "drizzle-orm";
import {
  type BookingsImportJobRecord,
  bookingsImportJob,
  type InsertBookingsImportJob,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export type BookingsImportJobStatus =
  | "DRAFT"
  | "NORMALIZING"
  | "NORMALIZED"
  | "COMMITTING"
  | "COMMITTED"
  | "FAILED"
  | "DISCARDED";

export interface IBookingsImportJobRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord | null>;
  findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord[]>;
  findActiveByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord[]>;
  findByUserIdAndPlaceId(
    userId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord[]>;
  create(
    data: InsertBookingsImportJob,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord>;
  update(
    id: string,
    data: Partial<InsertBookingsImportJob>,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord>;
  updateStatus(
    id: string,
    status: BookingsImportJobStatus,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord>;
  findLatestAiUsageByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<Date | null>;
}

export class BookingsImportJobRepository
  implements IBookingsImportJobRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(bookingsImportJob)
      .where(eq(bookingsImportJob.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(bookingsImportJob)
      .where(eq(bookingsImportJob.placeId, placeId))
      .orderBy(desc(bookingsImportJob.createdAt));
  }

  async findActiveByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord[]> {
    const client = this.getClient(ctx);
    const activeStatuses: BookingsImportJobStatus[] = [
      "DRAFT",
      "NORMALIZING",
      "NORMALIZED",
      "COMMITTING",
    ];
    return client
      .select()
      .from(bookingsImportJob)
      .where(
        and(
          eq(bookingsImportJob.placeId, placeId),
          inArray(bookingsImportJob.status, activeStatuses),
        ),
      )
      .orderBy(desc(bookingsImportJob.createdAt));
  }

  async findByUserIdAndPlaceId(
    userId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(bookingsImportJob)
      .where(
        and(
          eq(bookingsImportJob.userId, userId),
          eq(bookingsImportJob.placeId, placeId),
        ),
      )
      .orderBy(desc(bookingsImportJob.createdAt));
  }

  async create(
    data: InsertBookingsImportJob,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(bookingsImportJob)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertBookingsImportJob>,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(bookingsImportJob)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookingsImportJob.id, id))
      .returning();
    return result[0];
  }

  async updateStatus(
    id: string,
    status: BookingsImportJobStatus,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord> {
    const client = this.getClient(ctx);
    const now = new Date();
    const updates: Partial<InsertBookingsImportJob> = {
      status,
      updatedAt: now,
    };

    // Set timestamp fields based on status
    if (status === "NORMALIZED") {
      updates.normalizedAt = now;
    } else if (status === "COMMITTED") {
      updates.committedAt = now;
    } else if (status === "DISCARDED") {
      updates.discardedAt = now;
    }

    const result = await client
      .update(bookingsImportJob)
      .set(updates)
      .where(eq(bookingsImportJob.id, id))
      .returning();
    return result[0];
  }

  async findLatestAiUsageByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<Date | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ aiUsedAt: bookingsImportJob.aiUsedAt })
      .from(bookingsImportJob)
      .where(
        and(
          eq(bookingsImportJob.placeId, placeId),
          ne(bookingsImportJob.status, "DISCARDED"),
        ),
      )
      .orderBy(desc(bookingsImportJob.aiUsedAt))
      .limit(1);

    return result[0]?.aiUsedAt ?? null;
  }
}
