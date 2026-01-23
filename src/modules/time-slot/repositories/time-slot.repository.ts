import {
  and,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  ne,
  notInArray,
} from "drizzle-orm";
import {
  type InsertTimeSlot,
  reservation,
  reservationTimeSlot,
  type TimeSlotRecord,
  timeSlot,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

const toIsoString = (
  value: Date | string | null | undefined,
): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return null;
};

export interface TimeSlotWithPlayerInfo extends TimeSlotRecord {
  playerName?: string | null;
  playerPhone?: string | null;
  reservationId?: string | null;
  reservationStatus?:
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED"
    | "EXPIRED"
    | "CANCELLED"
    | null;
  reservationExpiresAt?: string | null;
}

export interface TimeSlotWithDetails extends TimeSlotRecord {
  isFree?: boolean | null;
}

export interface ITimeSlotRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotWithDetails | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<TimeSlotRecord | null>;
  findByIdsForUpdate(
    ids: string[],
    ctx: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  findByCourtAndDateRange(
    courtId: string,
    startDate: Date,
    endDate: Date,
    status?: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  findByCourtWithReservation(
    courtId: string,
    startDate: Date,
    endDate: Date,
    ctx?: RequestContext,
  ): Promise<TimeSlotWithPlayerInfo[]>;
  findAvailable(
    courtId: string,
    startDate: Date,
    endDate: Date,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  findAvailableByCourtIds(
    courtIds: string[],
    startDate: Date,
    endDate: Date,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  findOverlapping(
    courtId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  create(data: InsertTimeSlot, ctx?: RequestContext): Promise<TimeSlotRecord>;
  createMany(
    data: InsertTimeSlot[],
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  createManyBestEffort(
    data: InsertTimeSlot[],
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  update(
    id: string,
    data: Partial<InsertTimeSlot>,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord>;
  updateManyStatus(
    ids: string[],
    status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED",
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
}

export class TimeSlotRepository implements ITimeSlotRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotWithDetails | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(timeSlot)
      .where(eq(timeSlot.id, id))
      .limit(1);

    const slot = result[0];
    if (!slot) {
      return null;
    }

    return {
      ...slot,
      isFree: slot.priceCents === null,
    };
  }

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<TimeSlotRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(timeSlot)
      .where(eq(timeSlot.id, id))
      .for("update")
      .limit(1);
    return result[0] ?? null;
  }

  async findByIdsForUpdate(
    ids: string[],
    ctx: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    if (ids.length === 0) return [];
    const client = this.getClient(ctx) as DrizzleTransaction;
    return client
      .select()
      .from(timeSlot)
      .where(inArray(timeSlot.id, ids))
      .for("update");
  }

  async findByCourtAndDateRange(
    courtId: string,
    startDate: Date,
    endDate: Date,
    status?: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    const client = this.getClient(ctx);

    const conditions = [
      eq(timeSlot.courtId, courtId),
      gte(timeSlot.startTime, startDate),
      lte(timeSlot.endTime, endDate),
    ];

    if (status) {
      conditions.push(
        eq(
          timeSlot.status,
          status as "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED",
        ),
      );
    }

    return client
      .select()
      .from(timeSlot)
      .where(and(...conditions))
      .orderBy(timeSlot.startTime);
  }

  async findByCourtWithReservation(
    courtId: string,
    startDate: Date,
    endDate: Date,
    ctx?: RequestContext,
  ): Promise<TimeSlotWithPlayerInfo[]> {
    const client = this.getClient(ctx);

    const result = await client
      .select({
        id: timeSlot.id,
        courtId: timeSlot.courtId,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        status: timeSlot.status,
        priceCents: timeSlot.priceCents,
        currency: timeSlot.currency,
        createdAt: timeSlot.createdAt,
        updatedAt: timeSlot.updatedAt,
        reservationId: reservation.id,
        reservationStatus: reservation.status,
        reservationExpiresAt: reservation.expiresAt,
        playerName: reservation.playerNameSnapshot,
        playerPhone: reservation.playerPhoneSnapshot,
      })
      .from(timeSlot)
      .leftJoin(
        reservationTimeSlot,
        eq(reservationTimeSlot.timeSlotId, timeSlot.id),
      )
      .leftJoin(
        reservation,
        and(
          eq(reservation.id, reservationTimeSlot.reservationId),
          notInArray(reservation.status, ["EXPIRED", "CANCELLED"]),
        ),
      )
      .where(
        and(
          eq(timeSlot.courtId, courtId),
          gte(timeSlot.startTime, startDate),
          lte(timeSlot.endTime, endDate),
        ),
      )
      .orderBy(timeSlot.startTime);

    return result.map((slot) => ({
      ...slot,
      reservationExpiresAt: toIsoString(slot.reservationExpiresAt),
    }));
  }

  async findAvailable(
    courtId: string,
    startDate: Date,
    endDate: Date,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    return this.findByCourtAndDateRange(
      courtId,
      startDate,
      endDate,
      "AVAILABLE",
      ctx,
    );
  }

  async findAvailableByCourtIds(
    courtIds: string[],
    startDate: Date,
    endDate: Date,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    if (courtIds.length === 0) return [];
    const client = this.getClient(ctx);
    return client
      .select()
      .from(timeSlot)
      .where(
        and(
          inArray(timeSlot.courtId, courtIds),
          gte(timeSlot.startTime, startDate),
          lte(timeSlot.endTime, endDate),
          eq(timeSlot.status, "AVAILABLE"),
        ),
      )
      .orderBy(timeSlot.courtId, timeSlot.startTime);
  }

  async findOverlapping(
    courtId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    const client = this.getClient(ctx);

    const conditions = [
      eq(timeSlot.courtId, courtId),
      lt(timeSlot.startTime, endTime),
      gt(timeSlot.endTime, startTime),
    ];

    if (excludeId) {
      conditions.push(ne(timeSlot.id, excludeId));
    }

    return client
      .select()
      .from(timeSlot)
      .where(and(...conditions));
  }

  async create(
    data: InsertTimeSlot,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(timeSlot).values(data).returning();
    return result[0];
  }

  async createMany(
    data: InsertTimeSlot[],
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) return [];
    const result = await client.insert(timeSlot).values(data).returning();
    return result;
  }

  async createManyBestEffort(
    data: InsertTimeSlot[],
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) return [];
    const result = await client
      .insert(timeSlot)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return result;
  }

  async update(
    id: string,
    data: Partial<InsertTimeSlot>,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(timeSlot)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(timeSlot.id, id))
      .returning();
    return result[0];
  }

  async updateManyStatus(
    ids: string[],
    status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED",
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord[]> {
    if (ids.length === 0) return [];
    const client = this.getClient(ctx);
    return client
      .update(timeSlot)
      .set({ status, updatedAt: new Date() })
      .where(inArray(timeSlot.id, ids))
      .returning();
  }

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(timeSlot).where(eq(timeSlot.id, id));
  }
}
