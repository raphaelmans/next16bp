import { eq } from "drizzle-orm";
import {
  type InsertReservationChatThread,
  type ReservationChatThreadRecord,
  reservationChatThread,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IReservationChatThreadRepository {
  findByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<ReservationChatThreadRecord | null>;
  upsert(
    data: InsertReservationChatThread,
    ctx?: RequestContext,
  ): Promise<ReservationChatThreadRecord>;
}

export class ReservationChatThreadRepository
  implements IReservationChatThreadRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<ReservationChatThreadRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(reservationChatThread)
      .where(eq(reservationChatThread.reservationId, reservationId))
      .limit(1);

    return result[0] ?? null;
  }

  async upsert(
    data: InsertReservationChatThread,
    ctx?: RequestContext,
  ): Promise<ReservationChatThreadRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(reservationChatThread)
      .values(data)
      .onConflictDoUpdate({
        target: reservationChatThread.reservationId,
        set: {
          providerId: data.providerId,
          providerChannelType: data.providerChannelType,
          providerChannelId: data.providerChannelId,
          createdByUserId: data.createdByUserId,
        },
      })
      .returning();

    return result[0];
  }
}
