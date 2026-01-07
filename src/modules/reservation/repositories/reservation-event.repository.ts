import { eq, asc } from "drizzle-orm";
import {
  reservationEvent,
  type ReservationEventRecord,
  type InsertReservationEvent,
} from "@/shared/infra/db/schema";
import type { RequestContext } from "@/shared/kernel/context";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";

export interface IReservationEventRepository {
  findByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<ReservationEventRecord[]>;
  create(
    data: InsertReservationEvent,
    ctx?: RequestContext,
  ): Promise<ReservationEventRecord>;
}

export class ReservationEventRepository implements IReservationEventRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<ReservationEventRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(reservationEvent)
      .where(eq(reservationEvent.reservationId, reservationId))
      .orderBy(asc(reservationEvent.createdAt));
  }

  async create(
    data: InsertReservationEvent,
    ctx?: RequestContext,
  ): Promise<ReservationEventRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(reservationEvent)
      .values(data)
      .returning();
    return result[0];
  }
}
