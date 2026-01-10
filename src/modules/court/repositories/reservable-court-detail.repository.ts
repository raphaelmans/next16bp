import { eq } from "drizzle-orm";
import {
  type InsertReservableCourtDetail,
  type ReservableCourtDetailRecord,
  reservableCourtDetail,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface IReservableCourtDetailRepository {
  findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<ReservableCourtDetailRecord | null>;
  create(
    data: InsertReservableCourtDetail,
    ctx?: RequestContext,
  ): Promise<ReservableCourtDetailRecord>;
  update(
    id: string,
    data: Partial<InsertReservableCourtDetail>,
    ctx?: RequestContext,
  ): Promise<ReservableCourtDetailRecord>;
}

export class ReservableCourtDetailRepository
  implements IReservableCourtDetailRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByCourtId(
    courtId: string,
    ctx?: RequestContext,
  ): Promise<ReservableCourtDetailRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(reservableCourtDetail)
      .where(eq(reservableCourtDetail.courtId, courtId))
      .limit(1);
    return result[0] ?? null;
  }

  async create(
    data: InsertReservableCourtDetail,
    ctx?: RequestContext,
  ): Promise<ReservableCourtDetailRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(reservableCourtDetail)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertReservableCourtDetail>,
    ctx?: RequestContext,
  ): Promise<ReservableCourtDetailRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(reservableCourtDetail)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reservableCourtDetail.id, id))
      .returning();
    return result[0];
  }
}
