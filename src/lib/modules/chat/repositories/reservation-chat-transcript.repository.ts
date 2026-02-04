import { desc, eq } from "drizzle-orm";
import {
  type InsertReservationChatTranscript,
  type ReservationChatTranscriptRecord,
  reservationChatTranscript,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IReservationChatTranscriptRepository {
  listByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<ReservationChatTranscriptRecord[]>;
  create(
    data: InsertReservationChatTranscript,
    ctx?: RequestContext,
  ): Promise<ReservationChatTranscriptRecord>;
}

export class ReservationChatTranscriptRepository
  implements IReservationChatTranscriptRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async listByReservationId(
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<ReservationChatTranscriptRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(reservationChatTranscript)
      .where(eq(reservationChatTranscript.reservationId, reservationId))
      .orderBy(desc(reservationChatTranscript.capturedAt));
  }

  async create(
    data: InsertReservationChatTranscript,
    ctx?: RequestContext,
  ): Promise<ReservationChatTranscriptRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(reservationChatTranscript)
      .values(data)
      .returning();

    return result[0];
  }
}
