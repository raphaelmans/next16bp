import { eq } from "drizzle-orm";
import {
  type InsertReservablePlacePolicy,
  type ReservablePlacePolicyRecord,
  reservablePlacePolicy,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IPlacePolicyRepository {
  findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<ReservablePlacePolicyRecord | null>;
  create(
    data: InsertReservablePlacePolicy,
    ctx?: RequestContext,
  ): Promise<ReservablePlacePolicyRecord>;
  update(
    id: string,
    data: Partial<InsertReservablePlacePolicy>,
    ctx?: RequestContext,
  ): Promise<ReservablePlacePolicyRecord>;
}

export class PlacePolicyRepository implements IPlacePolicyRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<ReservablePlacePolicyRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(reservablePlacePolicy)
      .where(eq(reservablePlacePolicy.placeId, placeId))
      .limit(1);

    return result[0] ?? null;
  }

  async create(
    data: InsertReservablePlacePolicy,
    ctx?: RequestContext,
  ): Promise<ReservablePlacePolicyRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(reservablePlacePolicy)
      .values(data)
      .returning();

    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertReservablePlacePolicy>,
    ctx?: RequestContext,
  ): Promise<ReservablePlacePolicyRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(reservablePlacePolicy)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reservablePlacePolicy.id, id))
      .returning();

    return result[0];
  }
}
