import { asc, count, eq } from "drizzle-orm";
import {
  type InsertPlacePhoto,
  type PlacePhotoRecord,
  placePhoto,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IPlacePhotoRepository {
  findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord[]>;
  findById(id: string, ctx?: RequestContext): Promise<PlacePhotoRecord | null>;
  create(
    data: InsertPlacePhoto,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
  updateDisplayOrder(
    id: string,
    displayOrder: number,
    ctx?: RequestContext,
  ): Promise<void>;
  countByPlaceId(placeId: string, ctx?: RequestContext): Promise<number>;
}

export class PlacePhotoRepository implements IPlacePhotoRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(placePhoto)
      .where(eq(placePhoto.placeId, placeId))
      .orderBy(asc(placePhoto.displayOrder));
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(placePhoto)
      .where(eq(placePhoto.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async create(
    data: InsertPlacePhoto,
    ctx?: RequestContext,
  ): Promise<PlacePhotoRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(placePhoto).values(data).returning();
    return result[0];
  }

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(placePhoto).where(eq(placePhoto.id, id));
  }

  async updateDisplayOrder(
    id: string,
    displayOrder: number,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);
    await client
      .update(placePhoto)
      .set({ displayOrder })
      .where(eq(placePhoto.id, id));
  }

  async countByPlaceId(placeId: string, ctx?: RequestContext): Promise<number> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ count: count() })
      .from(placePhoto)
      .where(eq(placePhoto.placeId, placeId));

    return result[0]?.count ?? 0;
  }
}
