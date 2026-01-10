import { and, eq, gt, gte, lt, lte, ne, notInArray } from "drizzle-orm";
import {
  court,
  type InsertTimeSlot,
  reservableCourtDetail,
  reservation,
  type TimeSlotRecord,
  timeSlot,
} from "@/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/shared/infra/db/types";
import type { RequestContext } from "@/shared/kernel/context";

export interface TimeSlotWithPlayerInfo extends TimeSlotRecord {
  playerName?: string | null;
  playerPhone?: string | null;
}

export interface TimeSlotPaymentDetails {
  gcashNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  paymentInstructions: string | null;
}

export interface TimeSlotWithPaymentDetails extends TimeSlotRecord {
  paymentDetails: TimeSlotPaymentDetails | null;
}

export interface ITimeSlotRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<TimeSlotWithPaymentDetails | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<TimeSlotRecord | null>;
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
  update(
    id: string,
    data: Partial<InsertTimeSlot>,
    ctx?: RequestContext,
  ): Promise<TimeSlotRecord>;
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
  ): Promise<TimeSlotWithPaymentDetails | null> {
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
        paymentDetails: {
          gcashNumber: reservableCourtDetail.gcashNumber,
          bankName: reservableCourtDetail.bankName,
          bankAccountNumber: reservableCourtDetail.bankAccountNumber,
          bankAccountName: reservableCourtDetail.bankAccountName,
          paymentInstructions: reservableCourtDetail.paymentInstructions,
        },
      })
      .from(timeSlot)
      .innerJoin(court, eq(court.id, timeSlot.courtId))
      .leftJoin(
        reservableCourtDetail,
        eq(reservableCourtDetail.courtId, court.id),
      )
      .where(eq(timeSlot.id, id))
      .limit(1);

    const slot = result[0];
    if (!slot) {
      return null;
    }

    const details = slot.paymentDetails;
    const hasDetails =
      details?.gcashNumber ||
      details?.bankName ||
      details?.bankAccountNumber ||
      details?.bankAccountName ||
      details?.paymentInstructions;

    return {
      ...slot,
      paymentDetails: hasDetails ? details : null,
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

    // Left join with reservation to get player info for HELD/BOOKED slots
    // Only join with active reservations (not EXPIRED or CANCELLED)
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
        // Player info from reservation
        playerName: reservation.playerNameSnapshot,
        playerPhone: reservation.playerPhoneSnapshot,
      })
      .from(timeSlot)
      .leftJoin(
        reservation,
        and(
          eq(reservation.timeSlotId, timeSlot.id),
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

    return result;
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

  /**
   * Find slots that overlap with the given time range.
   * Overlap condition: existing.start < new.end AND existing.end > new.start
   */
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

  async delete(id: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(timeSlot).where(eq(timeSlot.id, id));
  }
}
