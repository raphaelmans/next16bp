import { eq, desc, and } from "drizzle-orm";
import {
  reservation,
  type ReservationRecord,
  type InsertReservation,
} from "@/shared/infra/db/schema";
import type { RequestContext } from "@/shared/kernel/context";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";

export interface IReservationRepository {
  findById(id: string, ctx?: RequestContext): Promise<ReservationRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<ReservationRecord | null>;
  findByPlayerId(
    playerId: string,
    pagination: { limit: number; offset: number },
    status?: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]>;
  findByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]>;
  findActiveByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord | null>;
  create(
    data: InsertReservation,
    ctx?: RequestContext,
  ): Promise<ReservationRecord>;
  update(
    id: string,
    data: Partial<InsertReservation>,
    ctx?: RequestContext,
  ): Promise<ReservationRecord>;
}

export class ReservationRepository implements IReservationRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(reservation)
      .where(eq(reservation.id, id))
      .limit(1);
    return result[0] ?? null;
  }

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<ReservationRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(reservation)
      .where(eq(reservation.id, id))
      .for("update")
      .limit(1);
    return result[0] ?? null;
  }

  async findByPlayerId(
    playerId: string,
    pagination: { limit: number; offset: number },
    status?: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]> {
    const client = this.getClient(ctx);

    const conditions = [eq(reservation.playerId, playerId)];

    if (status) {
      conditions.push(
        eq(
          reservation.status,
          status as
            | "CREATED"
            | "AWAITING_PAYMENT"
            | "PAYMENT_MARKED_BY_USER"
            | "CONFIRMED"
            | "EXPIRED"
            | "CANCELLED",
        ),
      );
    }

    return client
      .select()
      .from(reservation)
      .where(and(...conditions))
      .orderBy(desc(reservation.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);
  }

  async findByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(reservation)
      .where(eq(reservation.timeSlotId, timeSlotId));
  }

  async findActiveByTimeSlotId(
    timeSlotId: string,
    ctx?: RequestContext,
  ): Promise<ReservationRecord | null> {
    const client = this.getClient(ctx);
    // Find non-cancelled, non-expired reservations for this slot
    const results = await client
      .select()
      .from(reservation)
      .where(eq(reservation.timeSlotId, timeSlotId));

    // Filter to active reservations
    const active = results.find(
      (r) =>
        r.status !== "CANCELLED" &&
        r.status !== "EXPIRED" &&
        (r.status === "CONFIRMED" ||
          !r.expiresAt ||
          new Date(r.expiresAt) > new Date()),
    );

    return active ?? null;
  }

  async create(
    data: InsertReservation,
    ctx?: RequestContext,
  ): Promise<ReservationRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(reservation).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertReservation>,
    ctx?: RequestContext,
  ): Promise<ReservationRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(reservation)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reservation.id, id))
      .returning();
    return result[0];
  }
}
