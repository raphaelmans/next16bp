import { eq, count, asc } from "drizzle-orm";
import {
  courtPhoto,
  type CourtPhotoRecord,
  type InsertCourtPhoto,
} from "@/shared/infra/db/schema";
import type { RequestContext } from "@/shared/kernel/context";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";

export interface ICourtPhotoRepository {
  findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtPhotoRecord[]>;
  findById(id: string, ctx?: RequestContext): Promise<CourtPhotoRecord | null>;
  create(
    data: InsertCourtPhoto,
    ctx?: RequestContext,
  ): Promise<CourtPhotoRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
  updateDisplayOrder(
    id: string,
    order: number,
    ctx?: RequestContext,
  ): Promise<void>;
  countByCourtId(courtId: string, ctx?: RequestContext): Promise<number>;
}

export class CourtPhotoRepository implements ICourtPhotoRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<CourtPhotoRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(courtPhoto)
      .where(eq(courtPhoto.courtId, courtId))
      .orderBy(asc(courtPhoto.displayOrder));
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<CourtPhotoRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(courtPhoto)
      .where(eq(courtPhoto.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    data: InsertCourtPhoto,
    ctx?: RequestContext,
  ): Promise<CourtPhotoRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(courtPhoto).values(data).returning();
    return result[0];
  }

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(courtPhoto).where(eq(courtPhoto.id, id));
  }

  async updateDisplayOrder(
    id: string,
    order: number,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .update(courtPhoto)
      .set({ displayOrder: order })
      .where(eq(courtPhoto.id, id));
  }

  async countByCourtId(courtId: string, ctx?: RequestContext): Promise<number> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ count: count() })
      .from(courtPhoto)
      .where(eq(courtPhoto.courtId, courtId));
    return result[0]?.count ?? 0;
  }
}
